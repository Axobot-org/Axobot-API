import { DiscordAPIError } from "discord.js";

export function isDiscordAPIError(obj: unknown): obj is DiscordAPIError {
  return typeof obj === "object" && obj !== null && (obj as DiscordAPIError).code !== undefined;
}
