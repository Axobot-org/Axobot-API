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