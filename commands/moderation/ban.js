const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder 
} = require('discord.js');

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
            return interaction.reply({ content: 'You do not have permission to ban members.', flags: 64 });
        }

        if (!member) {
            return interaction.reply({ content: 'User not found in this server.', flags: 64 });
        }

        if (!member.bannable || member.id === interaction.guild.ownerId) {
            return interaction.reply({ content: 'I cannot ban this user.', flags: 64 });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'You cannot ban a member with equal or higher role.', flags: 64 });
        }

        try {
            const dmContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## 🔨 You Have Been Banned\n\n` +
                            `You have been banned from **${interaction.guild.name}**\n\n` +
                            `**Reason:** ${reason}\n` +
                            `**Moderator:** ${interaction.user.tag}\n\n` +
                            `*You can appeal this ban by contacting the server administrators.*`
                        )
                );
            await target.send({ components: [dmContainer] });
        } catch (err) {
        }

        await member.ban({ reason });

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`## 🔨 Member Banned`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing("Small")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### User Information\n` +
                        `> **User:** ${target.tag} (${target.id})\n` +
                        `> **Banned by:** ${interaction.user.tag}\n` +
                        `> **Date:** <t:${Math.floor(Date.now()/1000)}:F>`
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing("Small")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### Ban Details\n` +
                        `> **Reason:** ${reason}`
                    )
            );

        await interaction.reply({ components: [container] });
    }
};