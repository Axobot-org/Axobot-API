import express from "express";

import { tokenCheckMiddleware } from "../auth/tokens";
import { editGuildConfig, editRssFeeds, getBasicGuildInfo, getBotChangelog, getBotInfo, getDefaultGuildConfigOptions, getGlobalLeaderboard, getGuildChannels, getGuildConfig, getGuildConfigEditionLogs, getGuildLeaderboard, getGuildLeaderboardAsJson, getGuildRoleRewards, getGuildRoles, getGuildRssFeeds, getUserGuilds, putGuildLeaderboard, putRoleRewards, toggleRssFeed } from "./controler";
import { isDiscordServerAdmin, isDiscordServerMember } from "./middlewares";
import { editLeaderboardRateLimiter, editRoleRewardsRateLimiter, editRssFeedRateLimiter, getBotInfoRateLimiter, getDefaultGuildConfigRateLimiter, getGuildChannelAndRolesRateLimiter, getGuildConfigLogsRateLimiter, getGuildConfigRateLimiter, getGuildsListRateLimiter, getLeaderboardRateLimiter } from "./ratelimits";

const router = express.Router();

router.get("/default-guild-config", getDefaultGuildConfigRateLimiter, getDefaultGuildConfigOptions);

router.get("/changelog", getBotInfoRateLimiter, getBotChangelog);

router.get("/bot-info", getBotInfoRateLimiter, getBotInfo);

router.get("/guild/:guildId/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildConfig);

router.get("/guild/:guildId/config-logs", getGuildConfigLogsRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, getGuildConfigEditionLogs);

router.get("/guild/:guildId/role-rewards", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildRoleRewards);

router.get("/guild/:guildId/leaderboard", getLeaderboardRateLimiter, getGuildLeaderboard);

router.get("/guild/:guildId/leaderboard.json", getLeaderboardRateLimiter, getGuildLeaderboardAsJson);

router.get("/guild/:guildId/rss-feeds", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, getGuildRssFeeds);

router.get("/guild/:guildId/roles", getGuildChannelAndRolesRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getGuildRoles);

router.get("/guild/:guildId/channels", getGuildChannelAndRolesRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, getGuildChannels);

router.get("/guild/:guildId", getGuildsListRateLimiter, tokenCheckMiddleware, isDiscordServerMember, getBasicGuildInfo);

router.get("/leaderboard/global", getLeaderboardRateLimiter, getGlobalLeaderboard);

router.get("/@me/guilds", getGuildsListRateLimiter, tokenCheckMiddleware, getUserGuilds);


router.put("/guild/:guildId/leaderboard", editLeaderboardRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, putGuildLeaderboard);

router.put("/guild/:guildId/role-rewards", editRoleRewardsRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, putRoleRewards);

router.patch("/guild/:guildId/config", getGuildConfigRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, editGuildConfig);

router.post("/guild/:guildId/rss-feeds/:feedId/toggle", editRssFeedRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, toggleRssFeed);

router.patch("/guild/:guildId/rss-feeds", editRssFeedRateLimiter, tokenCheckMiddleware, isDiscordServerAdmin, editRssFeeds);

export default router;