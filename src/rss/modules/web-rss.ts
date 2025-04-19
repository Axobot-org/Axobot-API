import { createCache, memoryStore } from "cache-manager";
import Parser from "rss-parser";

import { ParsedEntry } from "./parsed-entry";

export default class WebRss {

    private parser = new Parser({
        timeout: 9e3, // 9 seconds
        headers: { "User-Agent": "Axobot feedparser" },
        cache: createCache(memoryStore({
            max: 1_000,
            ttl: 60 * 60 * 1000, // 1 hour
        })),
    });

    async getLastPost(url: string): Promise<ParsedEntry | undefined> {
        const feed = await this.getFeed(url);
        if (!feed) {
            return undefined;
        }
        const entry = feed.items[0];
        return this.parseEntry(feed, entry, url);
    }

    /**
     * Parse an RSS feed from a given URL
     * @returns The parsed feed
     */
    private async getFeed(url: string): Promise<Parser.Output<unknown> | null> {
        let feed: Parser.Output<unknown>;
        try {
            feed = await this.parser.parseURL(url);
        } catch (err) {
            const sanitizedUrl = url.replace(/[\n\r]/g, "").slice(0, 100);
            console.warn(`Error while fetching RSS feed from ${sanitizedUrl}: ${err}`);
            return null;
        }
        if (!feed || feed.items.length === 0) {
            console.debug(!feed ? "No feed found" : "No items found in feed");
            return null;
        }
        feed.items = await this.filterPinnedPosts(feed.items);
        return feed;
    }

    /**
     * Remove pinned posts from a feed entries
     */
    private async filterPinnedPosts(entries: Parser.Item[]) {
        while (entries.length >= 2 && (!entries[0].isoDate || !entries[1].isoDate || entries[0].isoDate < entries[1].isoDate)) {
            entries.shift();
        }
        return entries;
    }

    private parseEntry(feed: Parser.Output<unknown>, entry: Parser.Item, feedUrl: string): ParsedEntry {
        return {
            url: entry.link || feed.link || feedUrl,
            title: entry.title || "?",
            pubDate: entry.isoDate!,
            entryId: entry.id || entry.guid || entry.title || null,
            author: entry.creator || entry.author || feed.title || null,
            channel: feed.title || null,
            image: entry.mediaThumbnail?.url || this.extractImageFromEnclosure(entry) || this.extractFirstImageFromContent(entry.content || "") || null,
            postText: entry.contentSnippet || null,
            postDescription: entry.summary || null,
        };
    }

    private extractImageFromEnclosure(entry: Parser.Item): string | null {
        if (entry.enclosure?.type?.startsWith("image/")) {
            return entry.enclosure.url;
        }
        return null;
    }

    private extractFirstImageFromContent(content: string): string | null {
        const exp = new RegExp(
            [
                "(http(s?):)",
                "([/|.\\w\\s-])*",
                "\\.(?:jpe?g|gif|png|webp)",
            ].join(""),
            "i"
        );
        return content.match(exp)?.[0] || null;
    }
}