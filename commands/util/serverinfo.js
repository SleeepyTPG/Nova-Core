const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays information about this server.'),
    async execute(interaction) {
        const { guild } = interaction;

        const owner = await guild.fetchOwner();
        const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
        const roles = guild.roles.cache.filter(r => r.id !== guild.id).map(r => r.name).length;
        const channels = guild.channels.cache.size;
        const emojis = guild.emojis.cache.size;
        const boosts = guild.premiumSubscriptionCount;
        const boostLevel = guild.premiumTier;
        const members = guild.memberCount;

        const embed = new EmbedBuilder()
            .setTitle(`Server Info: ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .setColor(0x2ecc71)
            .addFields(
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `${owner.user.tag}`, inline: true },
                { name: 'Created', value: created, inline: true },
                { name: 'Members', value: `${members}`, inline: true },
                { name: 'Roles', value: `${roles}`, inline: true },
                { name: 'Channels', value: `${channels}`, inline: true },
                { name: 'Emojis', value: `${emojis}`, inline: true },
                { name: 'Boosts', value: `${boosts} (Level ${boostLevel})`, inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed]
        });
    }
};