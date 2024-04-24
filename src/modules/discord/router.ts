import express from "express";

import { tokenCheckMiddleware } from "../auth/tokens";
import { getBasicGuildInfo, getBotChangelog, getDefaultGuildConfigOptions, getGlobalLeaderboard, getGuildConfig, getGuildLeaderboard, getUserGuilds } from "./controler";
import { isDiscordServerMember } from "./middlewares";
import { getDefaultGuildConfigRateLimiter, getGuildConfigRateLimiter, getGuildsListRateLimiter, getLeaderboardRateLimiter } from "./ratelimits";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfigRateLimiter, getDefaultGuildConfigOptions);

router.get("/changelog", getBotChangelog);

router.get("/guild/:guildId(\\d+)/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildConfig);

router.get("/guild/:guildId(\\d+)/leaderboard", getLeaderboardRateLimiter, getGuildLeaderboard);

router.get("/guild/:guildId(\\d+)", getGuildsListRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getBasicGuildInfo);

router.get("/leaderboard/global", getLeaderboardRateLimiter, getGlobalLeaderboard);

router.get("/@me/guilds", getGuildsListRateLimiter, tokenCheckMiddleware, getUserGuilds);

export default router;