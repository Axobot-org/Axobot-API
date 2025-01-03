import rateLimit from "express-rate-limit";

export const getRssTestRateLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 2,
    standardHeaders: true,
});
