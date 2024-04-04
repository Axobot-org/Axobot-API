import { Guild } from "discord.js";

import DiscordClient from "../../../bot/client";
import { LeaderboardGuildData } from "../types/guilds";
import { getLevelFromGeneralXp, getLevelFromMEE6Xp, getXpFromGeneralLevel, getXpFromMEE6Level } from "./xp";

const discordClient = DiscordClient.getInstance();

export async function transformLeaderboard(leaderboard: {userID: bigint;xp: bigint;}[], firstRank: number, useMEE6: boolean) {
    const getLevelFromXp = useMEE6 ? getLevelFromMEE6Xp : getLevelFromGeneralXp;
    const getXpFromLevel = useMEE6 ? getXpFromMEE6Level : getXpFromGeneralLevel;
    return await Promise.all(leaderboard.map(async (entry, index) => {
        const user = await discordClient.getRawUserData(entry.userID.toString());
        const level = getLevelFromXp(Number(entry.xp));
        const xpToCurrentLevel = getXpFromLevel(level);
        const xpToNextLevel = getXpFromLevel(level + 1);
        return {
            "ranking": firstRank + index,
            "user_id": entry.userID,
            "xp": Number(entry.xp),
            "level": level,
            "xp_to_current_level": xpToCurrentLevel,
            "xp_to_next_level": xpToNextLevel,
            "username": user?.global_name ?? user?.username ?? null,
            "avatar": discordClient.getAvatarUrlFromHash(user?.avatar_hash ?? null, entry.userID),
        };
    }));
}

export async function getGuildInfo(guild: Guild): Promise<LeaderboardGuildData> {
    return {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL({ size: 256 }),
    };

}