import { RssFeedPUTData } from "../../modules/discord/types/guilds";

export interface RawRssFeed {
    ID: bigint;
    channel: bigint;
    type: string;
    link: string;
    date: string;
    structure: string;
    roles: string;
    use_embed: boolean;
    embed: string;
    silent_mention: boolean;
    recent_errors: number;
    enabled: boolean;
    added_at: string;
}

export const VALID_RSS_FEED_TYPES = ["bluesky", "deviantart", "twitch", "web", "yt"] as const;
export type VALID_RSS_FEED_TYPES = (typeof VALID_RSS_FEED_TYPES)[number];

export type RssFeedForCreation = Exclude<RssFeedPUTData["add"], undefined>[number];

export type RssFeedForEdition = Exclude<RssFeedPUTData["edit"], undefined>[number];

export interface DBRssFeed {
    id: bigint;
    channelId: bigint;
    type: string;
    link: string;
    date: Date;
    structure: string;
    roles: bigint[];
    useEmbed: boolean;
    embed: {
        authorText?: string;
        title?: string;
        footerText?: string;
        color?: number;
        showDateInFooter?: boolean;
        enableLinkInTitle?: boolean;
        imageLocation?: "thumbnail" | "banner" | "none";
    };
    silentMention: boolean;
    recentErrors: number;
    enabled: boolean;
    addedAt: Date;
}

export function rawToDBRssFeed(raw: RawRssFeed): DBRssFeed {
    return {
        id: raw.ID,
        channelId: raw.channel,
        type: raw.type,
        link: raw.link,
        date: new Date(raw.date),
        structure: raw.structure,
        roles: raw.roles ? raw.roles.split(";").map(BigInt) : [],
        useEmbed: Boolean(raw.use_embed),
        embed: JSON.parse(raw.embed),
        silentMention: Boolean(raw.silent_mention),
        recentErrors: raw.recent_errors,
        enabled: Boolean(raw.enabled),
        addedAt: new Date(raw.added_at),
    };
}