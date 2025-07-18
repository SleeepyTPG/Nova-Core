const { SlashCommandBuilder } = require('discord.js');
const ms = require('ms'); // Make sure to install 'ms' package: npm install ms

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member for a custom duration.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g. 10m, 1h, 2d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const durationInput = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ content: 'You do not have permission to timeout members.', Flags: 64 });
        }

        if (!member) {
            return interaction.reply({ content: 'User not found in this server.', Flags: 64 });
        }

        if (!member.moderatable || member.id === interaction.guild.ownerId) {
            return interaction.reply({ content: 'I cannot timeout this user.', Flags: 64 });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'You cannot timeout a member with equal or higher role.', Flags: 64 });
        }

        const durationMs = ms(durationInput);
        if (!durationMs || durationMs < 10000 || durationMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({ content: 'Invalid duration. Please use formats like `10m`, `1h`, `2d` (min: 10s, max: 28d).', Flags: 64 });
        }

        try {
            await target.send(`You have been timed out in **${interaction.guild.name}** for ${durationInput}.\nReason: ${reason}`);
        } catch (err) {
        }

        await member.timeout(durationMs, reason);

        await interaction.reply({
            content: `⏳ **${target.tag}** has been timed out for **${durationInput}**.\nReason: ${reason}`,
            ephemeral: false
        });
    }
};