const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!interaction.member.permissions.has('BanMembers')) {
            return interaction.reply({ content: 'You do not have permission to ban members.', Flags: 64 });
        }

        if (!member) {
            return interaction.reply({ content: 'User not found in this server.', Flags: 64 });
        }

        if (!member.bannable || member.id === interaction.guild.ownerId) {
            return interaction.reply({ content: 'I cannot ban this user.', Flags: 64 });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'You cannot ban a member with equal or higher role.', Flags: 64 });
        }

        try {
            await target.send(`You have been banned from **${interaction.guild.name}**.\nReason: ${reason}`);
        } catch (err) {
            
        }

        await member.ban({ reason });

        await interaction.reply({
            content: `🔨 **${target.tag}** has been banned.\nReason: ${reason}`,
        });
    }
};