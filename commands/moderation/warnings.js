const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
            return interaction.reply({ content: 'You do not have permission to view warnings.', ephemeral: true });
        }

        if (!warnings[guildId] || !warnings[guildId][userId] || warnings[guildId][userId].length === 0) {
            return interaction.reply({ content: `${target.tag} has no warnings.`, ephemeral: true });
        }

        const userWarnings = warnings[guildId][userId];
        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${target.tag}`)
            .setColor(0xFFA500)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(`Total warnings: **${userWarnings.length}**`)
            .addFields(
                ...userWarnings.slice(-10).map((warn, i) => ({
                    name: `#${userWarnings.length - 10 + i + 1} • ${warn.date.split('T')[0]}`,
                    value: `**Reason:** ${warn.reason}\n**Moderator:** ${warn.moderator}`,
                    inline: false
                }))
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};