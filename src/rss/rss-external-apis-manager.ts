import { createCache, MemoryCache, memoryStore } from "cache-manager";

import { DBRssFeed, VALID_RSS_FEED_TYPES } from "../database/models/rss";
import { ParsedEntry } from "./modules/parsed-entry";
import WebRss from "./modules/web-rss";
import YouTubeRss from "./modules/youtube-rss";

export default class RssExternalApisManager {
    private static instance: RssExternalApisManager;

    private displayNameCache: MemoryCache;

    private youtubeRss: YouTubeRss;

    private webRss: WebRss;


    private constructor() {
        this.displayNameCache = createCache(memoryStore({
            max: 100,
            ttl: 12 * 60 * 60 * 1000, // 12 hour
        }));
        this.youtubeRss = new YouTubeRss();
        this.webRss = new WebRss();
    }

    public static getInstance(): RssExternalApisManager {
        if (!RssExternalApisManager.instance) {
            RssExternalApisManager.instance = new RssExternalApisManager();
        }
        return RssExternalApisManager.instance;
    }

    async getRssFeedDisplayName(feed: Pick<DBRssFeed, "type" | "link">): Promise<string | undefined> {
        const cacheKey = `${feed.type}:${feed.link}`;
        const cached = await this.displayNameCache.get<string>(cacheKey);
        if (cached) {
            return cached;
        }
        let displayName: string | undefined;
        switch (feed.type) {
        case "yt":
            displayName = await this.youtubeRss.getDisplayName(feed.link);
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

    async testRssFeed(type: VALID_RSS_FEED_TYPES, url: string): Promise<ParsedEntry | undefined> {
        switch (type) {
        case "yt":
            return this.youtubeRss.getLastPost(url);
        case "web":
            return this.webRss.getLastPost(url);
        default:
            return undefined;
        }
    }

    private getMinecraftDisplayName(link: string): string {
        if (link.endsWith(":")) {
            return link.slice(0, -1);
        }
        return link;
    }

}

