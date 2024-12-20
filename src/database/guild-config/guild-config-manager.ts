import { Guild } from "discord.js";
import JSONbig from "json-bigint";
import { assertEquals } from "typia";

import Database from "../db";
import GuildConfigOptionsMap from "./guild-config-options.json";
import { AllRepresentation, GuildConfigOptionCategory, GuildConfigOptionsMapType, GuildConfigOptionValueType, PartialGuildConfig } from "./guild-config-types";
import { assertBooleanValidity, assertCategoryChannelValidity, assertColorValidity, assertEmojiListValidity, assertEnumValidity, assertLevelupChannelValidity, assertNumberValidity, assertRoleListValidity, assertRoleValidity, assertTextChannelListValidity, assertTextChannelValidity, assertTextValidity, assertVoiceChannelValidity } from "./value-validity-asserts";

export default class GuildConfigManager {
    private static instance: GuildConfigManager;

    private db: Database = Database.getInstance();

    private constructor() { }

    public static getInstance(): GuildConfigManager {
        if (!GuildConfigManager.instance) {
            GuildConfigManager.instance = new GuildConfigManager();
        }
        return GuildConfigManager.instance;
    }

    public static optionsList = assertEquals<GuildConfigOptionsMapType>(GuildConfigOptionsMap);

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

    public async convertFromType(optionName: string, value: unknown) {
        const option = await this.getOptionFromName(optionName);
        if (!option) {
            throw new Error(`Option ${optionName} does not exist`);
        }
        if (value === null) {
            return null;
        }
        switch (option.type) {
        case "int":
        case "float":
        case "boolean":
        case "role":
        case "text_channel":
        case "voice_channel":
        case "category":
        case "levelup_channel":
            return String(value);
        case "enum":
        case "text":
            if (typeof value !== "string") {
                throw new Error(`Value for option ${optionName} should be a string`);
            }
            return value;
        case "roles_list":
        case "text_channels_list":
        case "emojis_list":
            if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
                throw new Error(`Value for option ${optionName} should be an array of strings`);
            }
            return JSONbig.stringify(value.map(BigInt));
        case "color":
            if (typeof value !== "number") {
                throw new Error(`Value for option ${optionName} should be a number`);
            }
            return value.toString(16);
        default:
            // @ts-expect-error option type is not handled
            console.warn(`Untreated option type ${option.type}`);
            // @ts-expect-error option type is not handled
            throw new Error(`Option type ${option.type} is not supported at the moment`);
        }
    }

    public async assertValueValidity(optionName: string, guild: Guild, value: unknown, allowUnlistedOptions = false) {
        const option = await this.getOptionFromName(optionName);
        if (!option) {
            throw new Error(`Option ${optionName} does not exist`);
        }
        if (!allowUnlistedOptions && !option.is_listed) {
            throw new Error(`Option ${optionName} cannot be edited`);
        }
        switch (option.type) {
        case "boolean":
            assertBooleanValidity(optionName, option, value);
            break;
        case "int":
        case "float":
            assertNumberValidity(optionName, option, value);
            break;
        case "enum":
            assertEnumValidity(optionName, option, value);
            break;
        case "text":
            assertTextValidity(optionName, option, value);
            break;
        case "role":
            assertRoleValidity(optionName, option, value, guild);
            break;
        case "roles_list":
            assertRoleListValidity(optionName, option, value, guild);
            break;
        case "text_channel":
            assertTextChannelValidity(optionName, option, value, guild);
            break;
        case "text_channels_list":
            assertTextChannelListValidity(optionName, option, value, guild);
            break;
        case "voice_channel":
            assertVoiceChannelValidity(optionName, option, value, guild);
            break;
        case "category":
            assertCategoryChannelValidity(optionName, value, guild);
            break;
        case "emojis_list":
            assertEmojiListValidity(optionName, option, value, guild);
            break;
        case "color":
            assertColorValidity(optionName, value);
            break;
        case "levelup_channel":
            assertLevelupChannelValidity(optionName, value, guild);
            break;
        default:
            // @ts-expect-error option type is not handled
            console.warn(`Untreated option type ${option.type}`);
            // @ts-expect-error option type is not handled
            throw new Error(`Option type ${option.type} is not supported at the moment`);
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
            config[categoryName] = {};
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

    public async getGuildConfigOptions(guildId: bigint, optionNames: string[]) {
        const setupOptions = await this.db.getFullGuildConfigOptions(guildId);
        const defaultConfig = GuildConfigManager.optionsList;
        const config: Record<string, unknown> = Object.create(null);
        for (const categoryOptions of Object.values(defaultConfig)) {
            for (const [optionName, value] of Object.entries(categoryOptions)) {
                if (optionNames.includes(optionName)) {
                    const option = setupOptions.find((item) => item.option_name === optionName);
                    if (option === undefined) {
                        config[optionName] = value.default;
                    } else {
                        config[optionName] = await this.convertToType(option.option_name, option.value);
                    }
                }
            }
        }
        return config;
    }

}
