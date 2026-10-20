export interface TokenInformation {
  user_id: bigint;
  api_token: string;
  discord_token: string | null;
  created_at: Date;
  expires_at: Date;
}
