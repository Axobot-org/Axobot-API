import express from "express";

import { tokenCheckMiddleware } from "../auth/tokens";
import { editGuildConfig, getBasicGuildInfo, getBotChangelog, getDefaultGuildConfigOptions, getGlobalLeaderboard, getGuildChannels, getGuildConfig, getGuildLeaderboard, getGuildLeaderboardAsJson, getGuildRoles, getUserGuilds, putGuildLeaderboard } from "./controler";
import { isDiscordServerAdmin, isDiscordServerMember } from "./middlewares";
import { editLeaderboardRateLimiter, getDefaultGuildConfigRateLimiter, getGuildConfigRateLimiter, getGuildsListRateLimiter, getLeaderboardRateLimiter } from "./ratelimits";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfigRateLimiter, getDefaultGuildConfigOptions);

router.get("/changelog", getBotChangelog);

router.get("/guild/:guildId(\\d+)/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildConfig);

router.get("/guild/:guildId(\\d+)/leaderboard", getLeaderboardRateLimiter, getGuildLeaderboard);

router.get("/guild/:guildId(\\d+)/leaderboard.json", getLeaderboardRateLimiter, getGuildLeaderboardAsJson);

router.get("/guild/:guildId(\\d+)/roles", getGuildsListRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildRoles);

router.get("/guild/:guildId(\\d+)/channels", getGuildsListRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, getGuildChannels);

router.get("/guild/:guildId(\\d+)", getGuildsListRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getBasicGuildInfo);

router.get("/leaderboard/global", getLeaderboardRateLimiter, getGlobalLeaderboard);

router.get("/@me/guilds", getGuildsListRateLimiter, tokenCheckMiddleware, getUserGuilds);


router.put("/guild/:guildId(\\d+)/leaderboard", editLeaderboardRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, putGuildLeaderboard);

router.patch("/guild/:guildId(\\d+)/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, editGuildConfig);

export default router;