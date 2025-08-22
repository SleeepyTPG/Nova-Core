const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays information about a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get info about')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`## 👤 User Information: ${user.tag}`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing("Small")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### Basic Information\n` +
                        `> **Username:** ${user.username}\n` +
                        `> **Tag:** #${user.discriminator}\n` +
                        `> **User ID:** ${user.id}\n` +
                        `> **Bot:** ${user.bot ? 'Yes' : 'No'}\n` +
                        `> **Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>`
                    )
            );

        if (member) {
            container
                .addSeparatorComponents(
                    new SeparatorBuilder()
                        .setSpacing("Small")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `### Server Information\n` +
                            `> **Nickname:** ${member.nickname || 'None'}\n` +
                            `> **Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n` +
                            `> **Roles:** ${member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => `\`${r.name}\``).join(', ') || 'None'}`
                        )
                );

            if (member.voice && member.voice.channel) {
                container
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                            .setSpacing("Small")
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                `### Voice Status\n` +
                                `> **Current Channel:** ${member.voice.channel.name}\n` +
                                (member.voice.joinedTimestamp ? `> **Joined Voice:** <t:${Math.floor(member.voice.joinedTimestamp / 1000)}:R>` : '')
                            )
                    );
            }
        }

        container
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing("Small")
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