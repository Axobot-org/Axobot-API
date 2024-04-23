import express from "express";

import { tokenCheckMiddleware } from "../auth/tokens";
import { checkAdminAccess, getBotChangelog, getDefaultGuildConfigOptions, getGlobalLeaderboard, getGuildConfig, getGuildLeaderboard, getUserGuilds } from "./controler";
import { isDiscordServerAdmin, isDiscordServerMember } from "./middlewares";
import { getDefaultGuildConfigRateLimiter, getGuildConfigRateLimiter, getGuildsListRateLimiter, getLeaderboardRateLimiter } from "./ratelimits";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfigRateLimiter, getDefaultGuildConfigOptions);

router.get("/changelog", getBotChangelog);

router.get("/guild/:guildId(\\d+)/admin-access", tokenCheckMiddleware, isDiscordServerAdmin, checkAdminAccess);

router.get("/guild/:guildId(\\d+)/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildConfig);

router.get("/guild/:guildId(\\d+)/leaderboard", getLeaderboardRateLimiter, getGuildLeaderboard);

router.get("/leaderboard/global", getLeaderboardRateLimiter, getGlobalLeaderboard);

router.get("/@me/guilds", getGuildsListRateLimiter, tokenCheckMiddleware, getUserGuilds);

export default router;