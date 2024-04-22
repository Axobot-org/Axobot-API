import JSONbig from "json-bigint";

import Database from "../db";
import GuildConfigOptionsMap from "./guild-config-options.json";
import { AllRepresentation } from "./guild-config-types";

export const GuildConfigOptionCategoryNames = ["core", "info", "moderation", "partners", "poll-channels", "streamers", "voice-channels", "welcome", "xp"] as const;
export type GuildConfigOptionCategory = typeof GuildConfigOptionCategoryNames[number];
export type GuildConfigOptionsMapType = Record<GuildConfigOptionCategory, Record<string, AllRepresentation>>;
export type GuildConfigOptionValueType = AllRepresentation["default"] | bigint;
export type PartialGuildConfig = Partial<Record<GuildConfigOptionCategory, Record<string, unknown>>>;

export default class GuildConfigManager {
    private static instance: GuildConfigManager;

    private db: Database = Database.getInstance();

    private constructor() {}

    public static getInstance(): GuildConfigManager {
        if (!GuildConfigManager.instance) {
            GuildConfigManager.instance = new GuildConfigManager();
        }
        return GuildConfigManager.instance;
    }

    public static optionsList = GuildConfigOptionsMap as GuildConfigOptionsMapType;

    public async getOptionCategoryFromName(optionName: string): Promise<GuildConfigOptionCategory | undefined> {
        for (const [category, options] of Object.entries(GuildConfigManager.optionsList)) {
            if (options[optionName]) {
                return category as GuildConfigOptionCategory;
            }
        }
    }

    public async getOptionFromName(optionName: string): Promise<AllRepresentation | undefined> {
        const optionCategory = await this.getOptionCategoryFromName(optionName);
        if (!optionCategory) {
            return;
        }
        return GuildConfigManager.optionsList[optionCategory][optionName];
    }

    public async convertToType(optionName: string, value: string): Promise<GuildConfigOptionValueType> {
        const option = await this.getOptionFromName(optionName);
        if (!option) {
            throw new Error(`Option ${optionName} does not exist`);
        }
        switch (option.type) {
        case "boolean":
            return value.toLowerCase() === "true" || value === "1";
        case "int":
        case "float":
            return Number(value);
        case "color":
            // check for hex syntax
            if (/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(value)) {
                return Number("0x" + value);
            }
            return Number(value);
        case "role":
        case "text_channel":
        case "voice_channel":
        case "category":
        case "levelup_channel":
            if (option.type === "levelup_channel" && value === "any") {
                return value;
            }
            return BigInt(value);
        case "roles_list":
        case "text_channels_list":
        case "emojis_list":
            return JSONbig.parse(value);
        case "enum":
        case "text":
            return value;
        default:
            // @ts-expect-error option type is not handled
            console.warn(`Untreated option type ${option.type}`);
            return value;
        }
    }

    public async getGuildConfigOptionValue(guildId: bigint, optionName: string) {
        const dbValue = await this.db.getGuildConfigOptionValue(guildId, optionName);
        if (dbValue !== null) {
            return await this.convertToType(optionName, dbValue);
        }
        // if unset, return default value
        const option = await this.getOptionFromName(optionName);
        if (option === undefined) {
            throw new Error(`Option ${optionName} does not exist`);
        }
        return option.default;
    }

    public async getGuildCategoriesConfigOptions(guildId: bigint, categories: readonly GuildConfigOptionCategory[]): Promise<PartialGuildConfig> {
        const setupOptions = await this.db.getFullGuildConfigOptions(guildId);
        const defaultConfig = GuildConfigManager.optionsList;
        const config: PartialGuildConfig = Object.create(null);
        for (const categoryName of categories) {
            config[categoryName] = await this.getGuildConfigForCategory(guildId, categoryName);
            for (const [optionName, value] of Object.entries(defaultConfig[categoryName])) {
                const option = setupOptions.find((item) => item.option_name === optionName);
                if (option === undefined) {
                    config[categoryName]![optionName] = value.default;
                } else {
                    config[categoryName]![optionName] = await this.convertToType(option.option_name, option.value);
                }
            }
        }
        return config;
    }

    private async getGuildConfigForCategory(guildId: bigint, category: GuildConfigOptionCategory) {
        switch (category) {
        case "xp":
            return await this.getGuildXpConfig(guildId);
        default:
            return {};
        }
    }

    public async getGuildXpConfig(guildId: bigint) {
        const roleRewards = await this.db.getGuildRoleRewards(guildId);
        return {
            "role_rewards": roleRewards,
        };
    }

}
