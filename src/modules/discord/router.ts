import express from "express";

import { tokenCheckMiddleware } from "../auth/tokens";
import { editGuildConfig, getBasicGuildInfo, getBotChangelog, getBotInfo, getDefaultGuildConfigOptions, getGlobalLeaderboard, getGuildChannels, getGuildConfig, getGuildLeaderboard, getGuildLeaderboardAsJson, getGuildRoleRewards, getGuildRoles, getUserGuilds, putGuildLeaderboard } from "./controler";
import { isDiscordServerAdmin, isDiscordServerMember } from "./middlewares";
import { editLeaderboardRateLimiter, getBotInfoRateLimiter, getDefaultGuildConfigRateLimiter, getGuildConfigRateLimiter, getGuildsListRateLimiter, getLeaderboardRateLimiter } from "./ratelimits";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfigRateLimiter, getDefaultGuildConfigOptions);

router.get("/changelog", getBotInfoRateLimiter, getBotChangelog);

router.get("/bot-info", getBotInfoRateLimiter, getBotInfo);

router.get("/guild/:guildId/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildConfig);

router.get("/guild/:guildId/role-rewards", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildRoleRewards);

router.get("/guild/:guildId/leaderboard", getLeaderboardRateLimiter, getGuildLeaderboard);

router.get("/guild/:guildId/leaderboard.json", getLeaderboardRateLimiter, getGuildLeaderboardAsJson);

router.get("/guild/:guildId/roles", getGuildsListRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildRoles);

router.get("/guild/:guildId/channels", getGuildsListRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, getGuildChannels);

router.get("/guild/:guildId", getGuildsListRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getBasicGuildInfo);

router.get("/leaderboard/global", getLeaderboardRateLimiter, getGlobalLeaderboard);

router.get("/@me/guilds", getGuildsListRateLimiter, tokenCheckMiddleware, getUserGuilds);


router.put("/guild/:guildId/leaderboard", editLeaderboardRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, putGuildLeaderboard);

router.patch("/guild/:guildId/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, editGuildConfig);

export default router;