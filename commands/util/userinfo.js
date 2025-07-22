const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

        const embed = new EmbedBuilder()
            .setTitle(`User Info: ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .setColor(0x3498db)
            .addFields(
                { name: 'Username', value: user.username, inline: true },
                { name: 'Tag', value: `#${user.discriminator}`, inline: true },
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true }
            );

        if (member) {
            embed.addFields(
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
                { name: 'Roles', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.name).join(', ') || 'None', inline: false }
            );
        }

        await interaction.reply({ embeds: [embed] });
        if (member && member.voice.channel) {
            embed.addFields(
                { name: 'Voice Channel', value: member.voice.channel.name, inline: true },
                { name: 'Joined Voice', value: `<t:${Math.floor(member.voice.joinedTimestamp / 1000)}:F>`, inline: true }
            );
            await interaction.editReply({ embeds: [embed] });
        }
        else {
            embed.addFields(
                { name: 'Voice Channel', value: 'Not in a voice channel', inline: true }
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }
};