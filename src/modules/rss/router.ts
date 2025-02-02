import express from "express";

import { testRssFeed } from "./controler";
import { getRssTestRateLimiter } from "./ratelimits";

const router = express.Router();

router.get("/test", getRssTestRateLimiter, testRssFeed);

export default router;