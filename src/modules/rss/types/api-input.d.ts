import { VALID_RSS_FEED_TYPES } from "../../../database/models/rss";

export interface TestRssFeedInput {
    type: VALID_RSS_FEED_TYPES;
    url: string;
}