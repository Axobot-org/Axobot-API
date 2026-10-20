import rateLimit from "express-rate-limit";

export const postDiscordCallbackRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
});
