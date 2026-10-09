export interface DBRoleReward {
  id: bigint;
  guildId: bigint;
  roleId: bigint;
  level: bigint;
  addedAt: Date;
}

export interface PopulatedRoleReward extends DBRoleReward {
  role: {
    name: string;
    color: number;
  } | null;
}

export interface LeaderboardPlayer {
  userID: bigint;
  xp: bigint;
}
