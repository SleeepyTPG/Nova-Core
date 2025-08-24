const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    PermissionFlagsBits, 
    MessageFlags 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'quotes.json');

if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

let config = { channels: {} };
if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig() {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Quote system commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Submit a new quote')
                .addStringOption(option =>
                    option.setName('quote')
                        .setDescription('The quote text')
                        .setRequired(true)
                        .setMaxLength(1000))
                .addStringOption(option =>
                    option.setName('author')
                        .setDescription('Who said the quote')
                        .setRequired(false)
                        .setMaxLength(100))
                .addStringOption(option =>
                    option.setName('context')
                        .setDescription('Context of the quote')
                        .setRequired(false)
                        .setMaxLength(200)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setchannel')
                .setDescription('Set the quotes channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for quotes')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'setchannel') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: 'You need Administrator permissions to use this command.',
                    flags: MessageFlags.Ephemeral
                });
            }
            const channel = interaction.options.getChannel('channel');
            config.channels[interaction.guildId] = channel.id;
            saveConfig();
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`## ✅ Quotes Channel Set\nQuotes will now be sent to <#${channel.id}>`)
                );
            return interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
        }
        const quote = interaction.options.getString('quote');
        const author = interaction.options.getString('author') || 'Anonymous';
        const context = interaction.options.getString('context');
        const channelId = config.channels[interaction.guildId];
        if (!channelId) {
            return interaction.reply({
                content: 'Quotes channel not set! Ask an administrator to set it using `/quote setchannel`',
                flags: MessageFlags.Ephemeral
            });
        }
        try {
            const quotesChannel = await interaction.guild.channels.fetch(channelId);
            
            if (!quotesChannel) {
                return interaction.reply({
                    content: 'Quotes channel not found! Please contact an administrator.',
                    flags: MessageFlags.Ephemeral
                });
            }
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## 💭 New Quote\n\n` +
                            `> *"${quote}"*\n\n` +
                            `### — ${author}` +
                            (context ? `\n\n*Context: ${context}*` : '') +
                            `\n\n*Submitted by ${interaction.user.tag}*`
                        )
                );
            await quotesChannel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
            const confirmContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`## ✅ Quote Submitted!\nYour quote has been posted in <#${channelId}>`)
                );
            await interaction.reply({
                components: [confirmContainer],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error('Error in quote command:', error);
            await interaction.reply({
                content: 'Failed to submit quote. Please try again later.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};