const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'logchannel.json');

function getLogChannelId(guildId) {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return config[guildId] || null;
}

async function logAction(interaction, title, fields) {
    const logChannelId = getLogChannelId(interaction.guild.id);
    if (!logChannelId) return;

    const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel) return;

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${title}`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing("Small")
        );

    fields.forEach(field => {
        container
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(field)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing("Small")
            );
    });

    await logChannel.send({
        content: ' ',
        embeds: [],
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
    });
}

module.exports = { logAction };