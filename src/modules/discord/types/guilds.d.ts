import { GuildFeature, PermissionsBitField } from "discord.js";

import { VALID_RSS_FEED_TYPES } from "../../../database/models/rss";

interface LeaderboardGuildData {
    id: string;
    name: string;
    icon: string | null;
}

interface OauthGuildRawData {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    features: GuildFeature[];
}

interface OauthGuildData {
    id: string;
    name: string;
    icon: string | null;
    banner: string | null;
    splash: string | null;
    isOwner: boolean;
    isAdmin: boolean;
    isBotPresent: boolean;
    permissions: PermissionsBitField | null;
    features: GuildFeature[];
}

interface LeaderboardImportUserData {
    user_id: string;
    xp: number;
}

interface RoleRewardsPUTData {
    roleId: string;
    level: string;
}

interface __RssFeedPUT_Common {
    channelId: string;
    structure: string;
    roles: string[];
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
    enabled: boolean;
}

interface RssFeedPUTData {
    add?: (__RssFeedPUT_Common & {
        link: string;
        type: Exclude<typeof VALID_RSS_FEED_TYPES[number], "tw">;
    })[];
    edit?: (__RssFeedPUT_Common & {
        id: string;
    })[];
    remove?: string[];
}
