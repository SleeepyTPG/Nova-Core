const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'logchannel.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogchannel')
        .setDescription('Set the log channel for moderation actions.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to log actions in')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You need Administrator permissions to use this command.', flags: MessageFlags.Ephemeral });
        }
        const channel = interaction.options.getChannel('channel');
        let config = {};
        if (fs.existsSync(CONFIG_PATH)) {
            config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        }
        config[interaction.guild.id] = channel.id;
        fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        await interaction.reply({ content: `Log channel set to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
    }
};