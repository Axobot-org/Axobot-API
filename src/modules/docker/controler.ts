import { Request, Response } from "express";
import { is } from "typia";

import { DiscordMessage } from "../../utils/discord_message";
import { MinimalDockerPushEvent } from "./types";

const EMBED_COLOR = 0x0c49c2;

function sendToDiscord(webhookPath: string, data: DiscordMessage) {
    return fetch(`https://discord.com/api/webhooks/${webhookPath}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}

function callbackDockerhub(callbackUrl: string) {
    if (!callbackUrl.startsWith("https://registry.hub.docker.com/")) {
        return Promise.reject(new Error("Invalid callback domain"));
    }
    return fetch(callbackUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            state: "success",
            description: "The webhook has been forwarded to Discord",
            context: "Discord webhook forwarder",
        }),
    });
}

export async function postWebhookNotification(req: Request, res: Response) {
    const webhookPath = req.params.webhook_id + "/" + req.params.webhook_token;
    if (!/^\d+\/[\w-]+$/.test(webhookPath)) {
        res._err = "Invalid webhook path";
        res.status(400).send(res._err);
        return;
    }
    if (!is<MinimalDockerPushEvent>(req.body)) {
        res._err = "Invalid request body";
        res.status(400).send(res._err);
        return;
    }
    const repo = req.body.repository;
    const pushData = req.body.push_data;
    const callbackUrl = req.body.callback_url;
    const embed = {
        title: `New push on ${repo.repo_name}:${pushData.tag}`,
        description: `Pushed by ${pushData.pusher}\n\nLink: ${repo.repo_url}`,
        color: EMBED_COLOR,
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
    try {
        await callbackDockerhub(callbackUrl);
    } catch (err) {
        console.error("Failed to send callback:", err);
        res._err = "Failed to send callback";
        res.status(400).send(res._err);
        return;
    }
    res.send("ok");
}