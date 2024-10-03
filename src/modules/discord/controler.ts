import { ChannelType, GuildBasedChannel } from "discord.js";
import { NextFunction, Request, Response } from "express";
import { SqlError } from "mariadb";
import { is } from "typia";

import DiscordClient from "../../bot/client";
import Database from "../../database/db";
import GuildConfigManager from "../../database/guild-config/guild-config-manager";
import { GuildConfigOptionCategory, GuildConfigOptionCategoryNames } from "../../database/guild-config/guild-config-types";
import { LeaderboardPlayer } from "../../database/models/xp";
import { LeaderboardImportUserData } from "./types/guilds";
import { checkUserAuthentificationAndPermission, getGuildInfo, transformLeaderboard } from "./utils/leaderboard";


const db = Database.getInstance();
const discordClient = DiscordClient.getInstance();
const configManager = GuildConfigManager.getInstance();

function parseCategoriesParameter(category: unknown) {
    if (category === "all") {
        return "all";
    }
    if (typeof category !== "string") {
        return null;
    }
    const splitted = category.split(",");
    if (!is<GuildConfigOptionCategory[]>(splitted)) {
        return null;
    }
    return splitted;
}

export async function getDefaultGuildConfigOptions(req: Request, res: Response) {
    const optionsList = await discordClient.getDefaultGuildConfig();
    res.send(optionsList);
}

export async function getGuildConfig(req: Request, res: Response) {
    const categoriesQuery = parseCategoriesParameter(req.query.categories);
    if (categoriesQuery === null) {
        res.status(400).send("Invalid category");
        return;
    }
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const categories = (
        categoriesQuery === "all"
            ? GuildConfigOptionCategoryNames
            : categoriesQuery
    );
    const config = await configManager.getGuildCategoriesConfigOptions(guildId, categories);
    res.send(config);
}

export async function getGuildConfigEditionLogs(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 100;
    if (page < 0 || limit < 0 || limit > 500) {
        res.status(400).send("Invalid page or limit");
        return;
    }
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const editionLogs = (await db.getGuildConfigEditionLogs(guildId, page, limit)).map(log => ({
        ...log,
        data: JSON.parse(log.data),
    }));
    res.json(editionLogs);
}

export async function getGuildRoleRewards(req: Request, res: Response) {
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const roleRewards = await db.getGuildRoleRewards(guildId);
    res.json(roleRewards);
}

export async function getGlobalLeaderboard(req: Request, res: Response, next: NextFunction) {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    if (page < 0 || limit < 0 || limit > 100) {
        res.status(400).send("Invalid page or limit");
        return;
    }
    let players, playersCount;
    try {
        const leaderboard = await db.getGlobalLeaderboard(page, limit);
        players = await transformLeaderboard(leaderboard, page * limit, false);
        playersCount = await db.getGlobalLeaderboardCount();
    } catch (e) {
        next(e);
        return;
    }
    res.send({
        "guild": null,
        "players": players,
        "players_count": playersCount,
        "xp_type": "global",
        "xp_rate": 1.0,
        "xp_decay": 0,
    });
}

export async function getGuildLeaderboard(req: Request, res: Response, next: NextFunction) {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const guild = await discordClient.resolveGuild(guildId.toString());
    if (guild === null) {
        res._err = "Guild not found";
        res.status(404).send(res._err);
        return;
    }
    const isXpEnabled = await configManager.getGuildConfigOptionValue(guildId, "enable_xp");
    if (!isXpEnabled) {
        res.status(400).send("XP is not enabled for this guild");
        return;
    }
    const isPrivateLeaderboard = await configManager.getGuildConfigOptionValue(guildId, "private_leaderboard");
    if (isPrivateLeaderboard && !(await checkUserAuthentificationAndPermission(req, res))) {
        return;
    }
    const xpType = await configManager.getGuildConfigOptionValue(guildId, "xp_type") as string;
    let players, playersCount;
    try {
        if (xpType === "global") {
            const stringMemberIds = await discordClient.getGuildMemberIds(guildId.toString());
            if (stringMemberIds === null) {
                res.status(500).send("Failed to get guild members");
                return;
            }
            const memberIds = stringMemberIds.map((id) => BigInt(id));
            const leaderboard = await db.getFilteredGlobalLeaderboard(memberIds, page, limit);
            players = await transformLeaderboard(leaderboard, page * limit, false);
            playersCount = await db.getFilteredGlobalLeaderboardCount(memberIds);
        } else {
            const leaderboard = await db.getGuildLeaderboard(guildId, page, limit);
            players = await transformLeaderboard(leaderboard, page * limit, xpType === "mee6-like");
            playersCount = await db.getGuildLeaderboardCount(guildId);
        }
    } catch (e) {
        next(e);
        return;
    }
    const guildData = await getGuildInfo(guild);
    const xpRate = xpType === "global" ? 1.0 : await configManager.getGuildConfigOptionValue(guildId, "xp_rate") as number;
    const xpDecay = xpType === "global" ? 0 : await configManager.getGuildConfigOptionValue(guildId, "xp_decay") as number;
    const roleRewards = await discordClient.getGuildRoleRewards(guildId);
    res.send({
        "guild": guildData,
        "players": players,
        "players_count": playersCount,
        "xp_type": xpType,
        "xp_rate": xpRate,
        "xp_decay": xpDecay,
        "role_rewards": roleRewards,
    });
}

export async function getGuildLeaderboardAsJson(req: Request, res: Response, next: NextFunction) {
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const guild = await discordClient.resolveGuild(guildId.toString());
    if (guild === null) {
        res._err = "Guild not found";
        res.status(404).send(res._err);
        return;
    }
    const isXpEnabled = await configManager.getGuildConfigOptionValue(guildId, "enable_xp");
    if (!isXpEnabled) {
        res.status(400).send("XP is not enabled for this guild");
        return;
    }
    const isPrivateLeaderboard = await configManager.getGuildConfigOptionValue(guildId, "private_leaderboard");
    if (isPrivateLeaderboard && !(await checkUserAuthentificationAndPermission(req, res))) {
        return;
    }
    const xpType = await configManager.getGuildConfigOptionValue(guildId, "xp_type") as string;
    let leaderboard: LeaderboardPlayer[];
    try {
        if (xpType === "global") {
            const stringMemberIds = await discordClient.getGuildMemberIds(guildId.toString());
            if (stringMemberIds === null) {
                res.status(500).send("Failed to get guild members");
                return;
            }
            const memberIds = stringMemberIds.map((id) => BigInt(id));
            leaderboard = await db.getFilteredGlobalLeaderboard(memberIds);
        } else {
            leaderboard = await db.getGuildLeaderboard(guildId);
        }
    } catch (e) {
        next(e);
        return;
    }
    const parsedLeaderboard = leaderboard.map(player => ({
        "user_id": player.userID.toString(),
        xp: player.xp,
    }));
    res.send(parsedLeaderboard);
}

export async function getBotChangelog(req: Request, res: Response) {
    if (!is<"en" | "fr">(req.query.language)) {
        res.status(400).send("Invalid language");
        return;
    }
    const changelog = await db.getBotChangelog();
    res.send(
        changelog.map((entry) => ({
            "version": entry.version,
            "release_date": entry.release_date,
            "content": entry[req.query.language as "en" | "fr"],
        }))
    );
}

export async function getBotInfo(req: Request, res: Response) {
    const guildCount = await discordClient.getGuildCount();
    const flooringIndex = guildCount < 50 ? 1 : (guildCount < 1000 ? 10 : 50);
    const data = {
        "approximate_guild_count": Math.floor(guildCount / flooringIndex) * flooringIndex,
    };
    res.send(data);
}

export async function getUserGuilds(req: Request, res: Response) {
    if (!res.locals.user?.discord_token) {
        res.status(401).send("Invalid token");
        return;
    }
    const userGuilds = await discordClient.getGuildsFromOauth(res.locals.user.discord_token);

    if (userGuilds === 401) {
        res._err = "Invalid token";
        res.status(401).send(res._err);
        return;
    }

    if (userGuilds === null) {
        res._err = "Unable to get user guilds";
        res.status(500).send(res._err);
        return;
    }

    res.send(userGuilds);
}

export async function getBasicGuildInfo(req: Request, res: Response) {
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const guild = await discordClient.resolveGuild(guildId.toString());
    if (guild === null) {
        res._err = "Guild not found";
        res.status(404).send(res._err);
        return;
    }
    res.json(await discordClient.getBasicGuildInfo({ baseGuild: guild, userId: res.locals.user!.user_id.toString() }));
}

export async function getGuildRoles(req: Request, res: Response) {
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const guild = await discordClient.resolveGuild(guildId.toString());
    if (guild === null) {
        res._err = "Guild not found";
        res.status(404).send(res._err);
        return;
    }
    if (guild.roles.cache.size === 0) {
        await guild.roles.fetch();
    }
    const roles = guild.roles.cache.map((role) => ({
        "id": role.id,
        "name": role.name,
        "color": role.color,
        "position": role.position,
        "permissions": role.permissions.bitfield,
        "managed": role.managed,
    })).sort((a, b) => a.position - b.position);
    res.json(roles);
}

export async function getGuildChannels(req: Request, res: Response) {
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const guild = await discordClient.resolveGuild(guildId.toString());
    if (guild === null) {
        res._err = "Guild not found";
        res.status(404).send(res._err);
        return;
    }
    if (guild.channels.cache.size === 0) {
        await guild.channels.fetch();
    }
    const channelsList = Array.from(guild.channels.cache.values());
    const channelIds = new Set(channelsList.map((channel) => channel.id));
    const threadsList = Array.from((await guild.channels.fetchActiveThreads()).threads.values()).filter((thread) => !channelIds.has(thread.id));

    function createPositionId(channel: GuildBasedChannel): number {
        if (channel.type === ChannelType.GuildCategory) {
            return (channel.position + 1) * 100000;
        }
        const parentPosition = channel.parent ? createPositionId(channel.parent) : 0;
        let channelPosition: number;
        if (channel.isThread()) {
            channelPosition = 1;
        } else if (channel.isVoiceBased()) {
            channelPosition = (1000 + (channel.position + 1)) * 10;
        } else {
            channelPosition = (channel.position + 1) * 10;
        }
        return parentPosition + channelPosition;
    }

    const channels = [...channelsList, ...threadsList].map((channel) => ({
        "id": channel.id,
        "name": channel.name,
        "type": channel.type,
        "isText": channel.isTextBased(),
        "isVoice": channel.isVoiceBased(),
        "isThread": channel.isThread(),
        "isNSFW": "nsfw" in channel ? channel.nsfw : channel.parent?.nsfw ?? false,
        "position": "position" in channel ? channel.position : null,
        "parentId": "parentId" in channel ? channel.parentId : null,
        "positionId": createPositionId(channel),
    }))
        .sort((a, b) => a.positionId - b.positionId)
        .map((channel) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { positionId, ...cleanObject } = channel;
            return cleanObject;
        });
    res.json(channels);
}


export async function putGuildLeaderboard(req: Request, res: Response, next: NextFunction) {
    // check guild ID validity
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const guild = await discordClient.resolveGuild(guildId.toString());
    if (guild === null) {
        res._err = "Guild not found";
        res.status(404).send(res._err);
        return;
    }
    // check user ID validity
    if (res.locals.user === undefined) {
        res._err = "Invalid token";
        res.status(401).send(res._err);
        return;
    }
    // check xp configuration in guild
    const isXpEnabled = await configManager.getGuildConfigOptionValue(guildId, "enable_xp");
    if (!isXpEnabled) {
        res._err = "XP is not enabled for this guild";
        res.status(400).send(res._err);
        return;
    }
    const xpType = await configManager.getGuildConfigOptionValue(guildId, "xp_type") as string;
    if (xpType === "global") {
        res._err = "Cannot edit global leaderboard";
        res.status(400).send(res._err);
        return;
    }
    // check data validity
    const data = req.body;
    if (!is<LeaderboardImportUserData[]>(data) || data.length === 0) {
        res._err = "Invalid data";
        res.status(400).send(res._err);
        return;
    }
    // remove previous leaderboard
    try {
        await db.deleteGuildLeaderboard(guildId);
    } catch (err) {
        if (!(err instanceof SqlError) || err.code !== "ER_NO_SUCH_TABLE") {
            next(err);
            return;
        }
        await db.createGuildLeaderboard(guildId);
    }
    // store new leaderboard
    const leaderboardData = data.map((entry) => ({ userID: BigInt(entry.user_id), xp: entry.xp }));
    await db.setGuildLeaderboard(guildId, leaderboardData);
    // send success code
    await db.addConfigEditionLog(guildId, res.locals.user.user_id, "leaderboard_put", null);
    console.log(`Leaderboard for guild ${guildId} has been edited by ${res.locals.user?.user_id}`);
    res.sendStatus(204);
}

export async function editGuildConfig(req: Request, res: Response) {
    // check user and guild ID validity
    if (res.locals.user === undefined) {
        res.status(401).send("Invalid token");
        return;
    }
    let guildId;
    try {
        guildId = BigInt(req.params.guildId);
    } catch (e) {
        res._err = "Invalid guild ID";
        res.status(400).send(res._err);
        return;
    }
    const guild = await discordClient.resolveGuild(guildId.toString());
    if (guild === null) {
        res._err = "Guild not found";
        res.status(404).send(res._err);
        return;
    }
    // check config validity
    const config = req.body;
    if (!is<Record<string, unknown>>(config) || Object.keys(config).length === 0) {
        res._err = "Invalid config";
        res.status(400).send(res._err);
        return;
    }
    const errors: string[] = [];
    for (const [optionName, value] of Object.entries(config)) {
        if (value === null) continue;
        try {
            await configManager.assertValueValidity(optionName, guild, value);
        } catch (err) {
            errors.push(`${err}`);
        }
    }
    if (errors.length > 0) {
        res.status(400).send(errors);
        return;
    }
    // store new config into database and log the config change
    for (const [optionName, value] of Object.entries(config)) {
        const rawValue = await configManager.convertFromType(optionName, value);
        if (rawValue === null) {
            await db.resetGuildConfigOptionValue(guildId, optionName);
            await db.addConfigEditionLog(guildId, res.locals.user.user_id, "sconfig_option_reset", { option: optionName });
        } else {
            await db.setGuildConfigOptionValue(guildId, optionName, rawValue);
            await db.addConfigEditionLog(guildId, res.locals.user.user_id, "sconfig_option_set", { option: optionName, value: rawValue });
        }
    }
    // send updated config
    const updatedConfig = await configManager.getGuildConfigOption(guildId, Object.keys(config));
    res.send(updatedConfig);
}