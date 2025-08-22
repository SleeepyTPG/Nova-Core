const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays information about this server.'),
    async execute(interaction) {
        const { guild } = interaction;

        const owner = await guild.fetchOwner();
        const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
        const roles = guild.roles.cache.filter(r => r.id !== guild.id).map(r => r.name);
        const channels = {
            text: guild.channels.cache.filter(c => c.type === 0).size,
            voice: guild.channels.cache.filter(c => c.type === 2).size,
            categories: guild.channels.cache.filter(c => c.type === 4).size,
            total: guild.channels.cache.size
        };
        const emojis = guild.emojis.cache.size;
        const boosts = guild.premiumSubscriptionCount;
        const boostLevel = guild.premiumTier;
        const members = {
            total: guild.memberCount,
            online: guild.members.cache.filter(m => m.presence?.status === 'online').size,
            bots: guild.members.cache.filter(m => m.user.bot).size
        };

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`## 🏰 Server Information: ${guild.name}`)
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing("Small")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### 📌 Basic Information\n` +
                        `> **Server ID:** ${guild.id}\n` +
                        `> **Owner:** ${owner.user.tag}\n` +
                        `> **Created:** ${created}\n` +
                        `> **Verification Level:** ${guild.verificationLevel}`
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing("Small")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### 👥 Members\n` +
                        `> **Total Members:** ${members.total}\n` +
                        `> **Humans:** ${members.total - members.bots}\n` +
                        `> **Bots:** ${members.bots}`
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing("Small")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `### 📊 Statistics\n` +
                        `> **Channels:** ${channels.total} (${channels.text} text, ${channels.voice} voice, ${channels.categories} categories)\n` +
                        `> **Roles:** ${roles.length}\n` +
                        `> **Emojis:** ${emojis}\n` +
                        `> **Boosts:** ${boosts} (Level ${boostLevel})`
                    )
            )
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