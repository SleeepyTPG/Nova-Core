const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder 
} = require('discord.js');
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View a user\'s warning history.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check warnings for')
                .setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const warnings = loadWarnings();
        const guildId = interaction.guild.id;
        const userId = target.id;

        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ content: 'You do not have permission to view warnings.', flags: 64 });
        }

        if (!warnings[guildId] || !warnings[guildId][userId] || warnings[guildId][userId].length === 0) {
            return interaction.reply({ content: `${target.tag} has no warnings.`, flags: 64 });
        }

        const userWarnings = warnings[guildId][userId];
        const recentWarnings = userWarnings.slice(-10);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`# ⚠️ Warnings for ${target.tag}\nTotal warnings: **${userWarnings.length}**`)
            );

        recentWarnings.forEach((warn, i) => {
            container
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing("Small")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `### #${userWarnings.length - recentWarnings.length + i + 1} • ${warn.date.split('T')[0]}\n` +
                            `> **Reason:** ${warn.reason}\n` +
                            `> **Moderator:** ${warn.moderator}`
                        )
                );
        });

        await interaction.reply({ components: [container], flags: 64 });
    }
};