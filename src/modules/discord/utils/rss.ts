import { createCache, MemoryCache, memoryStore } from "cache-manager";

import { DBRssFeed } from "../../../database/models/rss";

export default class RssExternalApisManager {
    private static instance: RssExternalApisManager;

    private displayNameCache: MemoryCache;

    private constructor() {
        this.displayNameCache = createCache(memoryStore({
            max: 100,
            ttl: 12 * 60 * 60 * 1000, // 12 hour
        }));
    }

    public static getInstance(): RssExternalApisManager {
        if (!RssExternalApisManager.instance) {
            RssExternalApisManager.instance = new RssExternalApisManager();
        }
        return RssExternalApisManager.instance;
    }

    async getRssFeedDisplayName(feed: DBRssFeed): Promise<string | undefined> {
        const cacheKey = `${feed.type}:${feed.link}`;
        const cached = await this.displayNameCache.get<string>(cacheKey);
        if (cached) {
            return cached;
        }
        let displayName: string | undefined;
        switch (feed.type) {
        case "yt":
            displayName = await this.getYouTubeDisplayName(feed.link);
            break;
        case "mc":
            displayName = this.getMinecraftDisplayName(feed.link);
            break;
        default:
            return undefined;
        }
        if (displayName) {
            this.displayNameCache.set(cacheKey, displayName);
        }
        return displayName;
    }

    private async getYouTubeDisplayName(channelId: string): Promise<string | undefined> {
        if (channelId.length < 15 || channelId.length > 25) {
            console.warn(`Invalid YouTube channel ID: ${channelId}`);
            return undefined;
        }
        console.debug(`Fetching YouTube channel name for ${channelId}`);
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

    private getMinecraftDisplayName(link: string): string {
        if (link.endsWith(":")) {
            return link.slice(0, -1);
        }
        return link;
    }

}

