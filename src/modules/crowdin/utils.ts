import { DiscordMessage } from "../../utils/discord_message";
import { CrowdinProject, CrowdinUser } from "./types/commons";

/**
 * Generate an embed footer from a Crowdin user
 * @param user The Crowdin user
 * @returns The embed footer object
 */
export function footerFromUser(user: CrowdinUser) {
  return {
    text: `Pushed by ${user.username}`,
    icon_url: user.avatarUrl,
  };
}

/**
 * Generate an embed author from a Crowdin project
 * @param project The Crowding project
 * @returns The embed author object
 */
export function authorFromProject(project: CrowdinProject) {
  return {
    name: project.name,
    url: project.url,
  };
}

/**
 * Sends a message to a Discord webhook
 * @param webhookPath The webhook path
 * @param data The message to send
 * @returns The webhook response
 */
export function sendToDiscord(webhookPath: string, data: DiscordMessage) {
  if (!/^\d+\/\w+$/.test(webhookPath)) {
    return Promise.reject(new Error("Invalid webhook path"));
  }
  return fetch(`https://discord.com/api/webhooks/${webhookPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
