import { createCache, MemoryCache, memoryStore } from "cache-manager";
import Parser from "rss-parser";
import { is } from "typia";

import { ParsedEntry } from "./parsed-entry";

export default class YouTubeRss {

    private channelByAnyTermCache: MemoryCache;

    private urlPattern = new RegExp(/(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/(?:channel\/|user\/|c\/)?@?([^/\s?]+).*$/);

    private parser = new Parser({
        timeout: 7e3, // 7 seconds
        headers: { "User-Agent": "Axobot feedparser" },
    });

    constructor() {
        this.channelByAnyTermCache = createCache(memoryStore({
            max: 1_000,
            ttl: 12 * 60 * 60 * 1000, // 12 hour
        }));
    }

    async getDisplayName(channelId: string): Promise<string | undefined> {
        if (channelId.length < 15 || channelId.length > 25) {
            console.warn(`Invalid YouTube channel ID: ${channelId}`);
            return undefined;
        }
        const result = await fetch(
            "https://www.googleapis.com/youtube/v3/channels?" + new URLSearchParams({
                key: process.env.YOUTUBE_API_KEY,
                id: channelId,
                part: "snippet",
                maxResults: "1",
                fields: "items(snippet(title))",
            }).toString()
        );
        if (!result.ok) {
            console.warn(`Failed to fetch YouTube channel name for ${channelId}: ${result.status}`);
            console.debug(await result.text());
            return undefined;
        }
        const json = await result.json();
        if (!json.items || json.items.length === 0) {
            console.warn(`No YouTube channel found for ${channelId}`);
            return undefined;
        }
        return json.items[0].snippet.title;
    }

    async getLastPost(UrlOrhannelId: string): Promise<ParsedEntry | undefined> {
        const channelId = await this.getChannelByAnyTerm(UrlOrhannelId);
        if (!channelId) {
            return undefined;
        }
        const feed = await this.getFeed(channelId);
        if (!feed) {
            return undefined;
        }
        const entry = feed.items[0];
        return this.parseEntry(entry);
    }

    private async getChannelByAnyTerm(term: string): Promise<string | undefined> {
        if (term.length < 3) {
            console.warn(`Invalid search term: ${term}`);
            return undefined;
        }
        const urlMatch = this.urlPattern.exec(term);
        if (urlMatch) {
            term = urlMatch[1];
        }
        const cached = await this.channelByAnyTermCache.get<string>(term);
        if (cached) {
            return cached;
        }
        const channelId = (await this.isValidChannelId(term)) ? term : (await this.apiFindChannelByHandle(term));
        if (channelId) {
            this.channelByAnyTermCache.set(term, channelId);
            return channelId;
        }
        return undefined;
    }

    private async isValidChannelId(channelId: string) {
        const url = `https://www.youtube.com/channel/${channelId}`;
        const result = await fetch(url);
        return result.ok;
    }

    private async apiFindChannelByHandle(term: string) {
        const result = await fetch(
            "https://www.googleapis.com/youtube/v3/channels?" + new URLSearchParams({
                key: process.env.YOUTUBE_API_KEY,
                forHandle: term,
                part: "id",
                type: "channel",
                maxResults: "5",
            }).toString()
        );
        if (!result.ok) {
            console.warn(`Failed to fetch YouTube channel name for ${term}: ${result.status}`);
            console.debug(await result.text());
            return undefined;
        }
        const json = await result.json();
        if (!is<{items: {id: string}[]}>(json)) {
            console.warn(`Invalid YouTube API response for ${term}`);
            return undefined;
        }
        return json.items[0].id;
    }

    private async getFeed(channelId: string): Promise<Parser.Output<unknown> | null> {
        let feed: Parser.Output<unknown>;
        const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        try {
            feed = await this.parser.parseURL(url);
        } catch (err) {
            console.warn(`Error while fetching RSS feed from ${url}: ${err}`);
            return null;
        }
        if (!feed || feed.items.length === 0) {
            return null;
        }
        return feed;
    }

    private parseEntry(entry: Parser.Item): ParsedEntry {
        return {
            url: entry.link!,
            title: entry.title!,
            pubDate: entry.isoDate!,
            entryId: entry.id!,
            author: entry.author!,
            channel: entry.author!,
            image: entry.mediaThumbnail?.url || null,
            postText: entry.contentSnippet || null,
            postDescription: null,
        };
    }
}