export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: Date;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  tts?: boolean;
  flags?: number;
}
