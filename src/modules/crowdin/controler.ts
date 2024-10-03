import { Request, Response } from "express";

import { MapWithDefault } from "../../utils/defaut_map";
import { AnyCrowdinEvent, CrowdinBatchEvents, CrowdinFileEvent, CrowdinStringEvent, isFileEvent } from "./types";
import { CrowdinFileAddedEvent, CrowdinFileFullyTranslatedEvent, CrowdinFileUpdatedEvent, CrowdinSourceStringAddedEvent, CrowdinSourceStringDeletedEvent, CrowdinSourceStringUpdatedEvent } from "./types/events";
import { authorFromProject, footerFromUser, sendToDiscord } from "./utils";

const EMBED_COLOR = 0x66bb6a;

export async function postWebhookNotification(req: Request<{ webhook_id: string, webhook_token: string }, unknown, AnyCrowdinEvent | CrowdinBatchEvents>, res: Response) {
    const webhookPath = req.params.webhook_id + "/" + req.params.webhook_token;
    if (!/^\d+\/[\w-]+$/.test(webhookPath)) {
        res.status(400).send("Invalid webhook path");
        return;
    }
    // assign events to our lists
    const stringEvents: CrowdinStringEvent[] = [];
    const fileEvents: CrowdinFileEvent[] = [];
    if ("events" in req.body) {
        for (const event of req.body.events) {
            if (isFileEvent(event)) {
                fileEvents.push(event);
            } else {
                stringEvents.push(event);
            }
        }
    } else if (isFileEvent(req.body)) {
        fileEvents.push(req.body);
    } else {
        stringEvents.push(req.body);
    }
    // handle string events
    if (stringEvents.length > 0) {
        await handleBatchStringsUpdate(webhookPath, stringEvents);
    }
    // handle file events
    for (const event of fileEvents) {
        switch (event.event) {
        case "file.added":
            await handleFileAddedEvent(webhookPath, event);
            break;
        case "file.translated":
            await handleFileTranslatedEvent(webhookPath, event);
            break;
        case "file.updated":
            await handleFileUpdatedEvent(webhookPath, event);
            break;
        }
    }
    res.send("ok");
}


async function handleFileAddedEvent(webhookPath: string, event: CrowdinFileAddedEvent) {
    const projectUrl = event.file.project.url;
    const embed = {
        title: "New file added",
        description: `File: ${event.file.path}\n\n[Go to project](${projectUrl})`,
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.file.project),
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
}

async function handleFileTranslatedEvent(webhookPath: string, event: CrowdinFileFullyTranslatedEvent) {
    const projectUrl = event.file.project.url;
    const embed = {
        title: "File fully translated",
        description: `File: ${event.file.path}\nLanguage: ${event.targetLanguage.name}\n\n[Go to project](${projectUrl})`,
        color: EMBED_COLOR,
        author: authorFromProject(event.file.project),
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
}

async function handleFileUpdatedEvent(webhookPath: string, event: CrowdinFileUpdatedEvent) {
    const projectUrl = event.file.project.url;
    const embed = {
        title: "File updated",
        description: `File: ${event.file.path}\n\n[Go to project](${projectUrl})`,
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.file.project),
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
}


async function handleBatchStringsUpdate(webhookPath: string, events: CrowdinStringEvent[]) {
    if (events.length === 1) {
        const event = events[0];
        switch (event.event) {
        case "string.added":
            await handleStringAdded(webhookPath, event);
            break;
        case "string.updated":
            await handleStringUpdated(webhookPath, event);
            break;
        case "string.deleted":
            await handleStringDeleted(webhookPath, event);
            break;
        }
        return;
    }
    const project = events[0].string.project;
    // assign each string to its event category
    const eventsMap = new MapWithDefault<string, Set<string>>(() => new Set());
    for (const event of events) {
        const file = event.string.file.path;
        const stringId = event.string.identifier;
        switch (event.event) {
        case "string.added":
            // if the string has been marked as deleted, mark it as updated
            if (eventsMap.get("deleted-" + file).has(stringId)) {
                eventsMap.get("deleted-" + file).delete(stringId);
                eventsMap.get("updated-" + file).add(stringId);
            } else {
                eventsMap.get("added-" + file).add(stringId);
            }
            break;
        case "string.updated":
            eventsMap.get("updated-" + file).add(stringId);
            break;
        case "string.deleted":
            // if the string has been marked as added, mark it as updated
            if (eventsMap.get("added-" + file).has(stringId)) {
                eventsMap.get("added-" + file).delete(stringId);
                eventsMap.get("updated-" + file).add(stringId);
            } else {
                eventsMap.get("deleted-" + file).add(stringId);
            }
            break;
        }
    }
    let text = "";
    for (const [eventKey, event] of eventsMap.entries()) {
        if (event.size === 0) continue;
        const [eventType, file] = eventKey.split("-", 2);
        const strings = [...event];
        const _strings = strings.length === 1 ? "string" : "strings";
        text += `${strings.length} ${_strings} ${eventType} in ${file}\n`;
    }
    text += `\n[Go to project](${project.url})`;
    const _strings = events.length === 1 ? "string" : "strings";
    const embed = {
        title: `${events.length} ${_strings} edited`,
        description: text,
        color: EMBED_COLOR,
        footer: footerFromUser(events[0].user),
        author: authorFromProject(project),
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
}

async function handleStringAdded(webhookPath: string, event: CrowdinSourceStringAddedEvent) {
    const stringText = event.string.text.length < 200 ? event.string.text : event.string.text.substring(0, 200) + "...";
    const embed = {
        title: "Source string added",
        description: `File: ${event.string.file.path}\nKey: ${event.string.key}\n\n[Go to project](${event.string.url})`,
        fields: [
            { name: "Text", value: stringText },
        ],
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.string.project),
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
}

async function handleStringUpdated(webhookPath: string, event: CrowdinSourceStringUpdatedEvent) {
    const stringText = event.string.text.length < 200 ? event.string.text : event.string.text.substring(0, 200) + "...";
    const embed = {
        title: "Source string updated",
        description: `File: ${event.string.file.path}\nKey: ${event.string.key}\n\n[Go to project](${event.string.url})`,
        fields: [
            { name: "Text", value: stringText },
        ],
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.string.project),
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
}

async function handleStringDeleted(webhookPath: string, event: CrowdinSourceStringDeletedEvent) {
    const stringText = event.string.text.length < 200 ? event.string.text : event.string.text.substring(0, 200) + "...";
    const embed = {
        title: "Source string deleted",
        description: `File: ${event.string.file.path}\nKey: ${event.string.key}\n\n[Go to project](${event.string.url})`,
        fields: [
            { name: "Text", value: stringText },
        ],
        color: EMBED_COLOR,
        footer: footerFromUser(event.user),
        author: authorFromProject(event.string.project),
    };
    await sendToDiscord(webhookPath, { embeds: [embed] });
}

