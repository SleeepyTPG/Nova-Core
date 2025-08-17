const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeperatorBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get the avatar of a user or the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get the avatar of')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('server')
                .setDescription('Show the server icon')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const showServer = interaction.options.getBoolean('server');

        if (showServer) {
            const guild = interaction.guild;
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## 🖼️ Server Icon: ${guild.name}\n\n` +
                            `[View Original](${guild.iconURL({ size: 4096 })})\n\n` +
                            `![Server Icon](${guild.iconURL({ size: 1024 })})`
                        )
                )
                .addSeperatorComponents(
                    new SeperatorBuilder()
                        .setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`*Requested by ${interaction.user.tag}*`)
                );

            return interaction.reply({
                components: [container]
            });
        }

        const targetUser = user || interaction.user;
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## 👤 Avatar: ${targetUser.tag}\n\n` +
                        `[View Original](${targetUser.displayAvatarURL({ size: 4096, dynamic: true })})\n\n` +
                        `![User Avatar](${targetUser.displayAvatarURL({ size: 1024, dynamic: true })})`
                    )
            )
            .addSeperatorComponents(
                new SeperatorBuilder()
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### Additional Information\n` +
                        `> **User ID:** ${targetUser.id}\n` +
                        `> **Account Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`
                    )
            )
            .addSeperatorComponents(
                new SeperatorBuilder()
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`*Requested by ${interaction.user.tag}*`)
            );

        await interaction.reply({
            components: [container]
        });
    }
};