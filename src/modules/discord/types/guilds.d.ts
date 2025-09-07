import { GuildFeature, PermissionsBitField } from "discord.js";

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

interface RssFeedPUTData {
    id: string;
    channelId: string;
    structure: string;
    roles: string[];
    useEmbed: boolean;
    embed: {
        author_text?: string;
        title?: string;
        footer_text?: string;
        color?: number;
        show_date_in_footer?: boolean;
        enable_link_in_title?: boolean;
        image_location?: "thumbnail" | "banner" | "none";
    };
    silentMention: boolean;
    enabled: boolean;
}