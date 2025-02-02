import { Request, Response } from "express";
import { is } from "typia";

import RssExternalApisManager from "../../rss/rss-external-apis-manager";
import setCacheControl from "../../utils/cache_control";
import { TestRssFeedInput } from "./types/api-input";


const rssExternalApisManager = RssExternalApisManager.getInstance();

export async function testRssFeed(req: Request, res: Response) {
    const data = req.query;
    if (!is<TestRssFeedInput>(data)) {
        res._err = "Invalid data";
        res.status(400).send(res._err);
        return;
    }
    if (data.type === "web" && !checkWebUrl(data.url)) {
        res._err = "Invalid web URL";
        res.status(400).send(res._err);
    }
    const result = await rssExternalApisManager.testRssFeed(data.type, data.url);
    if (!result) {
        res._err = "No data found";
        res.status(400).send(res._err);
        return;
    }
    setCacheControl(res, 86400);
    res.json(result);
}

function checkWebUrl(url: string) {
    try {
        new URL(url);
    } catch (err) {
        return false;
    }
    return url.startsWith("https://");
}