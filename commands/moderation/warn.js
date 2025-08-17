const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeperatorBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const WARN_FILE = path.join(__dirname, '..', '..', 'data', 'warnings.json');

function ensureWarnFile() {
    if (!fs.existsSync(WARN_FILE)) {
        fs.mkdirSync(path.dirname(WARN_FILE), { recursive: true });
        fs.writeFileSync(WARN_FILE, '{}');
    }
}

function loadWarnings() {
    ensureWarnFile();
    return JSON.parse(fs.readFileSync(WARN_FILE, 'utf8'));
}

function saveWarnings(warnings) {
    fs.writeFileSync(WARN_FILE, JSON.stringify(warnings, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member and keep track of their warnings.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ 
                content: 'You do not have permission to warn members.', 
                Flags: 64 
            });
        }

        if (!member) {
            return interaction.reply({ 
                content: 'User not found in this server.', 
                Flags: 64 
            });
        }

        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({ 
                content: 'You cannot warn the server owner.', 
                Flags: 64 
            });
        }

        const warnings = loadWarnings();
        const guildId = interaction.guild.id;
        const userId = target.id;

        if (!warnings[guildId]) warnings[guildId] = {};
        if (!warnings[guildId][userId]) warnings[guildId][userId] = [];

        const warnData = {
            moderator: interaction.user.tag,
            reason,
            date: new Date().toISOString()
        };

        warnings[guildId][userId].push(warnData);
        saveWarnings(warnings);

        try {
            const dmContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## ⚠️ Warning Received\n\n` +
                            `You have been warned in **${interaction.guild.name}**\n\n` +
                            `**Reason:** ${reason}\n` +
                            `**Moderator:** ${interaction.user.tag}\n` +
                            `**Total Warnings:** ${warnings[guildId][userId].length}\n\n` +
                            `*Use \`/warnings\` in the server to view all your warnings.*`
                        )
                );
            await target.send({ components: [dmContainer] });
        } catch (err) {
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`## ⚠️ Warning Issued`)
            )
            .addSeperatorComponents(
                new SeperatorBuilder()
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### User Information\n` +
                        `> **User:** ${target.tag} (${target.id})\n` +
                        `> **Warned by:** ${interaction.user.tag}\n` +
                        `> **Date:** <t:${Math.floor(Date.now()/1000)}:F>`
                    )
            )
            .addSeperatorComponents(
                new SeperatorBuilder()
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### Warning Details\n` +
                        `> **Reason:** ${reason}\n` +
                        `> **Total Warnings:** ${warnings[guildId][userId].length}`
                    )
            );

        await interaction.reply({ components: [container] });
    }
};