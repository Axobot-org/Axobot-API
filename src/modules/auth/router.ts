import express from "express";

import { getDiscordCallback as postDiscordCallback, getMe } from "./controler";
import { postDiscordCallbackRateLimiter } from "./ratelimits";
import { tokenCheckMiddleware } from "./tokens";

const router = express.Router();

router.get("/me", tokenCheckMiddleware, getMe);

router.post("/discord-callback", postDiscordCallbackRateLimiter, postDiscordCallback);

export default router;
