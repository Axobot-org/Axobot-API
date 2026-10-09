import { T_VALID_RSS_FEED_TYPES } from "../../../database/models/rss";

export interface TestRssFeedInput {
  type: T_VALID_RSS_FEED_TYPES;
  url: string;
}
