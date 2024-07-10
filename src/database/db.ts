import { createPool, Pool, PoolConfig, Types } from "mariadb";

import { TokenInformation } from "./models/auth";
import { DBRawUserData } from "./models/users";
import { DBRoleReward, LeaderboardPlayer } from "./models/xp";

const BETA = process.env.DISCORD_ENTITY_ID === "1";

const DB_CONFIG: PoolConfig = {
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined,
    trace: BETA,
    timezone: "auto",

    typeCast: function castField(field, useDefaultTypeCasting) {
        // We only want to cast bit fields that have a single-bit in them. If the field
        // has more than one bit, then we cannot assume it is supposed to be a Boolean.
        if ( ( field.type === Types.BIT ) && ( field.columnLength === 1 ) ) {
            const bytes = field.buffer();
            // A Buffer in Node represents a collection of 8-bit unsigned integers.
            // Therefore, our single "bit field" comes back as the bits '0000 0001',
            // which is equivalent to the number 1.
            return (bytes !== null && bytes[ 0 ] === 1);
        }

        return ( useDefaultTypeCasting() );
    },
};

export default class Database {
    private static instance: Database;

    private axobotPool: Pool;

    private apiPool: Pool;

    private xpPool: Pool;

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database(DB_CONFIG);
        }
        return Database.instance;
    }

    private constructor(config: PoolConfig) {
        this.axobotPool = createPool({ ...config, database: "axobot" });
        this.apiPool = createPool(config);
        this.xpPool = createPool({ ...config, database: "zbot-xp" });
    }

    public async getFullGuildConfigOptions(guildId: bigint): Promise<{ option_name: string, value: string }[]> {
        return await this.axobotPool.query<{ option_name: string, value: string }[]>("SELECT `option_name`, `value` FROM `serverconfig` WHERE `guild_id` = ? AND `beta` = ?", [guildId, BETA]);
    }

    public async getGuildConfigOptionValue(guildId: bigint, optionName: string): Promise<string | null> {
        const result = await this.axobotPool.query<{ value: string }[]>("SELECT  `value` FROM `serverconfig` WHERE `guild_id` = ? AND `option_name` = ? AND `beta` = ?", [guildId, optionName, BETA]);
        return result[0]?.value ?? null;
    }

    public async setGuildConfigOptionValue(guildId: bigint, optionName: string, value: string) {
        await this.axobotPool.query("INSERT INTO `serverconfig` (`guild_id`, `option_name`, `value`, `beta`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?", [guildId, optionName, value, BETA, value]);
    }

    public async resetGuildConfigOptionValue(guildId: bigint, optionName: string) {
        await this.axobotPool.query("DELETE FROM `serverconfig` WHERE `guild_id` = ? AND `option_name` = ? AND `beta` = ?", [guildId, optionName, BETA]);
    }

    public async resetGuildConfigOptions(guildId: bigint) {
        await this.axobotPool.query("DELETE FROM `serverconfig` WHERE `guild_id` = ? AND `beta` = ?", [guildId, BETA]);
    }

    public async getGlobalLeaderboard(page = 0, limit = 50): Promise<LeaderboardPlayer[]> {
        return await this.axobotPool.query("SELECT `userID`, `xp` FROM `xp` WHERE banned = 0 ORDER BY `xp` DESC LIMIT ?, ?", [page * limit, limit]);
    }

    public async getGlobalLeaderboardCount(): Promise<number> {
        const result = await this.axobotPool.query("SELECT COUNT(*) AS `count` FROM `xp` WHERE banned = 0");
        return result[0].count;
    }

    public async getFilteredGlobalLeaderboard(userIds: bigint[], page = 0, limit = 50): Promise<LeaderboardPlayer[]> {
        return await this.axobotPool.query("SELECT `userID`, `xp` FROM `xp` WHERE banned = 0 AND `userID` IN (?) ORDER BY `xp` DESC LIMIT ?, ?", [userIds, page * limit, limit]);
    }

    public async getFilteredGlobalLeaderboardCount(userIds: bigint[]): Promise<number> {
        const result = await this.axobotPool.query("SELECT COUNT(*) AS `count` FROM `xp` WHERE banned = 0 AND `userID` IN (?)", [userIds]);
        return result[0].count;
    }

    public async getGuildLeaderboard(guildId: bigint, page = 0, limit = 50): Promise<LeaderboardPlayer[]> {
        return await this.xpPool.query("SELECT `userID`, `xp` FROM `" + guildId + "` WHERE banned = 0 ORDER BY `xp` DESC LIMIT ?, ?", [page * limit, limit]);
    }

    public async getGuildLeaderboardCount(guildId: bigint): Promise<number> {
        const result = await this.xpPool.query("SELECT COUNT(*) AS `count` FROM `" + guildId + "` WHERE banned = 0");
        return result[0].count;
    }

    public async getUserDataFromCache(userIds: bigint[]): Promise<DBRawUserData[]> {
        return await this.axobotPool.query("SELECT `user_id`, `username`, `global_name`, `avatar_hash`, `is_bot` from `users_cache` WHERE `user_id` IN (?)", [userIds]);
    }

    public async getBotChangelog(): Promise<{version: string, release_date: string, fr: string, en: string}[]> {
        return await this.axobotPool.query("SELECT `version`, `release_date`, `fr`, `en` FROM `changelogs` WHERE `beta` = ? ORDER BY `release_date` DESC LIMIT 100", [BETA]);
    }

    public async getGuildRoleRewards(guildId: bigint): Promise<DBRoleReward[]> {
        interface RawData {
            ID: string;
            guild: string;
            role: string;
            level: string;
            added_at: string;
        }
        const result = await this.axobotPool.query<RawData[]>("SELECT `ID`, `guild`, `role`, `level`, `added_at` FROM `roles_rewards` WHERE `guild` = ?", [guildId]);
        return result.map((row) => ({
            id: BigInt(row.ID),
            guildId: BigInt(row.guild),
            roleId: BigInt(row.role),
            level: BigInt(row.level),
            addedAt: new Date(row.added_at),
        }));
    }


    public async getTokenInformation(apiToken: string): Promise<TokenInformation | null> {
        const result = await this.apiPool.query<TokenInformation[]>("SELECT `user_id`, `api_token`, `discord_token`, `created_at`, `expires_at` FROM `tokens` WHERE `api_token` = ?", [apiToken]);
        return result[0] ?? null;
    }

    public async registerToken(userId: bigint, apiToken: string, discordToken: string | null, expiresAt: Date) {
        await this.apiPool.query("INSERT INTO `tokens` (`user_id`, `api_token`, `discord_token`, `expires_at`) VALUES (?, ?, ?, ?)", [userId, apiToken, discordToken, expiresAt]);
    }

}