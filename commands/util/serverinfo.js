const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    MessageFlags 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays information about this server.'),
    async execute(interaction) {
        try {
            const { guild } = interaction;

            const owner = await guild.fetchOwner().catch(() => null);
            const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
            const rolesArr = guild.roles.cache
                .filter(r => r.id !== guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.name);
            const rolesDisplay = rolesArr.length > 20
                ? rolesArr.slice(0, 20).join(', ') + `, and ${rolesArr.length - 20} more...`
                : rolesArr.join(', ') || 'None';

            const channels = {
                text: guild.channels.cache.filter(c => c.type === 0).size,
                voice: guild.channels.cache.filter(c => c.type === 2).size,
                categories: guild.channels.cache.filter(c => c.type === 4).size,
                total: guild.channels.cache.size
            };
            const emojis = guild.emojis.cache.size;
            const boosts = guild.premiumSubscriptionCount;
            const boostLevel = ['None', '1', '2', '3'][guild.premiumTier] || guild.premiumTier;
            const members = {
                total: guild.memberCount,
                bots: guild.members.cache.filter(m => m.user.bot).size
            };

            const iconUrl = guild.iconURL({ size: 1024, dynamic: true });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`## 🏰 Server Information: ${guild.name}`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing("Small")
                );

            if (iconUrl) {
                container.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`![Server Icon](${iconUrl})`)
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing("Small")
                );
            }

            container
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `### 📌 Basic Information\n` +
                            `> **Server ID:** ${guild.id}\n` +
                            `> **Owner:** ${owner ? owner.user.tag : 'Unknown'}\n` +
                            `> **Created:** ${created}\n` +
                            `> **Verification Level:** ${guild.verificationLevel}`
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing("Small")
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
                    new SeparatorBuilder().setSpacing("Small")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `### 📊 Statistics\n` +
                            `> **Channels:** ${channels.total} (${channels.text} text, ${channels.voice} voice, ${channels.categories} categories)\n` +
                            `> **Roles:** ${rolesArr.length}\n` +
                            `> **Emojis:** ${emojis}\n` +
                            `> **Boosts:** ${boosts} (Level ${boostLevel})`
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing("Small")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `### 🏷️ Roles\n` +
                            `> ${rolesDisplay}`
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing("Small")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`*Requested by ${interaction.user.tag}*`)
                );

            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            console.error('Error in serverinfo command:', error);
            await interaction.reply({
                content: 'An error occurred while fetching server info.',
                ephemeral: true
            });
        }
    }
};