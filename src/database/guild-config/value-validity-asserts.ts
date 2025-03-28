import { ChannelType, Guild, GuildBasedChannel, NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, VoiceChannel } from "discord.js";

import { BooleanOptionRepresentation, EmojisListOptionRepresentation, EnumOptionRepresentation, FloatOptionRepresentation, IntOptionRepresentation, RoleOptionRepresentation, RolesListOptionRepresentation, TextChannelOptionRepresentation, TextChannelsListOptionRepresentation, TextOptionRepresentation, VoiceChannelOptionRepresentation } from "./guild-config-types";


export function assertNumberValidity(optionName: string, option: IntOptionRepresentation | FloatOptionRepresentation, value: unknown) {
    if (typeof value !== "number") {
        throw new Error(`Option ${optionName} should be a number (${option.type})`);
    }
    if (option.type === "int" && !Number.isInteger(value)) {
        throw new Error(`Option ${optionName} should be an integer`);
    }
    if (value < option.min) {
        throw new Error(`Option ${optionName} should be greater than ${option.min}`);
    }
    if (option.max !== null && value > option.max) {
        throw new Error(`Option ${optionName} should be lower than ${option.max}`);
    }
}

export function assertBooleanValidity(optionName: string, option: BooleanOptionRepresentation, value: unknown) {
    if (typeof value !== "boolean") {
        throw new Error(`Option ${optionName} should be a boolean`);
    }
}

export function assertEnumValidity(optionName: string, option: EnumOptionRepresentation, value: unknown) {
    if (typeof value !== "string") {
        throw new Error(`Option ${optionName} should be a string`);
    }
    if (!option.values.includes(value)) {
        throw new Error(`Option ${optionName} should be one of ${option.values.join(", ")}`);
    }
}

export function assertTextValidity(optionName: string, option: TextOptionRepresentation, value: unknown) {
    if (typeof value !== "string") {
        throw new Error(`Option ${optionName} should be a string`);
    }
    if (value.length < option.min_length) {
        throw new Error(`Option ${optionName} should be at least ${option.min_length} characters long`);
    }
    if (value.length > option.max_length) {
        throw new Error(`Option ${optionName} should be at most ${option.max_length} characters long`);
    }
}

export function assertRoleValidity(optionName: string, option: RoleOptionRepresentation, value: unknown, guild: Guild) {
    if (typeof value !== "string") {
        throw new Error(`Option ${optionName} should be a string`);
    }
    const role = guild.roles.cache.get(value);
    if (role === undefined) {
        throw new Error(`Option ${optionName} should be a valid role ID`);
    }
    if (!option.allow_integrated_roles && role.managed) {
        throw new Error(`Option ${optionName} should not be an integrated role`);
    }
    if (!option.allow_everyone && role.id === guild.id) {
        throw new Error(`Option ${optionName} should not be the @everyone role`);
    }
}

export function assertRoleListValidity(optionName: string, option: RolesListOptionRepresentation, value: unknown, guild: Guild) {
    if (!Array.isArray(value)) {
        throw new Error(`Option ${optionName} should be an array`);
    }
    if (value.length < option.min_count) {
        throw new Error(`Option ${optionName} should have at least ${option.min_count} roles`);
    }
    if (value.length > option.max_count) {
        throw new Error(`Option ${optionName} should have at most ${option.max_count} roles`);
    }
    for (const roleId of value) {
        const role = guild.roles.cache.get(roleId);
        if (role === undefined) {
            throw new Error(`Option ${optionName} should be a valid role ID (${roleId})`);
        }
        if (!option.allow_integrated_roles && role.managed) {
            throw new Error(`Option ${optionName} should not contain an integrated role (${roleId})`);
        }
        if (!option.allow_everyone && role.id === guild.id) {
            throw new Error(`Option ${optionName} should not contain the @everyone role (${roleId})`);
        }
    }
}

function isTextChannel(channel: GuildBasedChannel): channel is PublicThreadChannel | NewsChannel | TextChannel | PrivateThreadChannel {
    return [
        ChannelType.AnnouncementThread,
        ChannelType.GuildAnnouncement,
        ChannelType.GuildText,
        ChannelType.PrivateThread,
        ChannelType.PublicThread,
    ].includes(channel.type);
}

function isVoiceChannel(channel: GuildBasedChannel): channel is VoiceChannel | StageChannel {
    return [
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
    ].includes(channel.type);
}

export function assertTextChannelValidity(optionName: string, option: TextChannelOptionRepresentation, value: unknown, guild: Guild) {
    if (typeof value !== "string") {
        throw new Error(`Option ${optionName} should be a string`);
    }
    const channel = guild.channels.cache.get(value);
    if (channel === undefined || !isTextChannel(channel)) {
        throw new Error(`Option ${optionName} should be a valid text channel ID`);
    }
    if (!option.allow_threads && channel.isThread()) {
        throw new Error(`Option ${optionName} should not be a thread channel`);
    }
    if (!option.allow_announcement_channels && channel.type === ChannelType.GuildAnnouncement) {
        throw new Error(`Option ${optionName} should not be an announcement channel`);
    }
    if (!option.allow_non_nsfw_channels) {
        if (("nsfw" in channel && channel.nsfw) || (channel.isThread() && channel.parent?.nsfw)) {
            throw new Error(`Option ${optionName} cannot be a NSFW channel`);
        }
    }
}

export function assertTextChannelListValidity(optionName: string, option: TextChannelsListOptionRepresentation, value: unknown, guild: Guild) {
    if (!Array.isArray(value)) {
        throw new Error(`Option ${optionName} should be an array`);
    }
    if (value.length < option.min_count) {
        throw new Error(`Option ${optionName} should have at least ${option.min_count} channels`);
    }
    if (value.length > option.max_count) {
        throw new Error(`Option ${optionName} should have at most ${option.max_count} channels`);
    }
    for (const channelId of value) {
        const channel = guild.channels.cache.get(channelId);
        if (channel === undefined || !(isTextChannel(channel) || isVoiceChannel(channel))) {
            throw new Error(`Option ${optionName} should be a valid list of text channel IDs (${channelId})`);
        }
        if (!option.allow_threads && channel.isThread()) {
            throw new Error(`Option ${optionName} should not contain a thread channel (${channelId})`);
        }
        if (!option.allow_announcement_channels && channel.type === ChannelType.GuildAnnouncement) {
            throw new Error(`Option ${optionName} should not contain an announcement channel (${channelId})`);
        }
        if (!option.allow_non_nsfw_channels) {
            if (("nsfw" in channel && channel.nsfw) || (channel.isThread() && channel.parent?.nsfw)) {
                throw new Error(`Option ${optionName} cannot contain a NSFW channel (${channelId})`);
            }
        }
    }
}

export function assertVoiceChannelValidity(optionName: string, option: VoiceChannelOptionRepresentation, value: unknown, guild: Guild) {
    if (typeof value !== "string") {
        throw new Error(`Option ${optionName} should be a string`);
    }
    const channel = guild.channels.cache.get(value);
    if (channel === undefined || (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)) {
        throw new Error(`Option ${optionName} should be a valid voice channel ID`);
    }
    if (!option.allow_stage_channels && channel.type === ChannelType.GuildStageVoice) {
        throw new Error(`Option ${optionName} should not be a stage channel`);
    }
    if (!option.allow_non_nsfw_channels && channel.nsfw) {
        throw new Error(`Option ${optionName} cannot be a NSFW channel`);
    }
}

export function assertCategoryChannelValidity(optionName: string, value: unknown, guild: Guild) {
    if (typeof value !== "string") {
        throw new Error(`Option ${optionName} should be a string`);
    }
    const channel = guild.channels.cache.get(value);
    if (channel === undefined || channel.type !== ChannelType.GuildCategory) {
        throw new Error(`Option ${optionName} should be a valid category channel ID`);
    }
}

export function assertEmojiListValidity(optionName: string, option: EmojisListOptionRepresentation, value: unknown, guild: Guild) {
    if (!Array.isArray(value)) {
        throw new Error(`Option ${optionName} should be an array`);
    }
    for (const emojiId of value) {
        if (typeof emojiId !== "string") {
            throw new Error(`Option ${optionName} should be an array of strings`);
        }
        const emoji = guild.emojis.cache.get(emojiId);
        if (emoji === undefined && !/^[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u{200D}]+$/u.test(emojiId)) {
            throw new Error(`Option ${optionName} should be a valid Unicode emoji or custom emoji ID (${emojiId})`);
        }
    }
}

export function assertColorValidity(optionName: string, value: unknown) {
    if (typeof value !== "number") {
        throw new Error(`Option ${optionName} should be a number`);
    }
    if (value < 0 || value > 0xFFFFFF) {
        throw new Error(`Option ${optionName} should be a number between 0 and 0xFFFFFF`);
    }
}

export function assertLevelupChannelValidity(optionName: string, value: unknown, guild: Guild) {
    if (typeof value !== "string") {
        throw new Error(`Option ${optionName} should be a string`);
    }
    if (["any", "none", "dm"].includes(value)) {
        return;
    }
    assertTextChannelValidity(
        optionName,
        { type: "text_channel", "allow_threads": true, "allow_announcement_channels": true, "allow_non_nsfw_channels": true, "default": null, "is_listed": true },
        value,
        guild
    );
}