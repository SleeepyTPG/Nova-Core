const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!interaction.member.permissions.has('KickMembers')) {
            return interaction.reply({ content: 'You do not have permission to kick members.', Flags: 64 });
        }

        if (!member) {
            return interaction.reply({ content: 'User not found in this server.', Flags: 64 });
        }

        if (!member.kickable || member.id === interaction.guild.ownerId) {
            return interaction.reply({ content: 'I cannot kick this user.', Flags: 64 });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'You cannot kick a member with equal or higher role.', Flags: 64 });
        }

        try {
            await target.send(`You have been kicked from **${interaction.guild.name}**.\nReason: ${reason}`);
        } catch (err) {
        }

        await member.kick(reason);

        await interaction.reply({
            content: `👢 **${target.tag}** has been kicked.\nReason: ${reason}`,
            ephemeral: false
        });
    }
};