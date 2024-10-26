import express from "express";

import { postWebhookNotification } from "./controler";

const router = express.Router();

router.post("/webhook/:webhook_id/:webhook_token", postWebhookNotification);

export default router;