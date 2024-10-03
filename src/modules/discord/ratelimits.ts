import rateLimit from "express-rate-limit";

export const getDefaultGuildConfigRateLimiter = rateLimit({
    windowMs: 20 * 1000,
    max: 5,
    standardHeaders: true,
});

export const getBotInfoRateLimiter = rateLimit({
    windowMs: 20 * 1000,
    max: 10,
    standardHeaders: true,
});

export const getGuildConfigRateLimiter = rateLimit({
    windowMs: 20 * 1000,
    max: 10,
    standardHeaders: true,
});

export const getGuildConfigLogsRateLimiter = rateLimit({
    windowMs: 20 * 1000,
    max: 5,
    standardHeaders: true,
});

export const getLeaderboardRateLimiter = rateLimit({
    windowMs: 15 * 1000,
    max: 6,
    standardHeaders: true,
});

export const editLeaderboardRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2,
    standardHeaders: true,
});

export const getGuildsListRateLimiter = rateLimit({
    windowMs: 15 * 1000,
    max: 3,
    standardHeaders: true,
});