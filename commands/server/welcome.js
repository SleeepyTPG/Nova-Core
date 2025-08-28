const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    SeparatorBuilder, 
    TextDisplayBuilder, 
    SectionBuilder, 
    ThumbnailBuilder, 
    MessageFlags 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'welcome.json');

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
        .setName('welcome')
        .setDescription('Manage and display welcome messages.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the welcome channel.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send welcome messages to.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview the welcome message.')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

if (subcommand === 'set') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: 'You need the **Administrator** permission to use this command.',
            flags: MessageFlags.Ephemeral
        });
    }

    const channel = interaction.options.getChannel('channel');
    if (!channel || channel.type !== 0) {
        return interaction.reply({ 
            content: 'Please select a valid text channel.', 
            flags: MessageFlags.Ephemeral 
        });
    }

            config.channels[interaction.guild.id] = channel.id;
            saveConfig();

            return interaction.reply({ 
                content: `✅ Welcome channel set to ${channel}.`, 
                flags: MessageFlags.Ephemeral 
            });
        }

        if (subcommand === 'preview') {
            const container = new SectionBuilder()
                .setComponents(
                    new ThumbnailBuilder()
                        .setUrl('https://i.imgur.com/AfFp7pu.png')
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing("Small")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## 🎉 Welcome to **${interaction.guild.name}**!\n\n` +
                            `We're thrilled to have you here. Please take a moment to read through our community guidelines and introduce yourself in <#introductions>.\n\n` +
                            `If you have any questions, feel free to reach out to our moderators or check out <#faq>.\n\n` +
                            `Enjoy your stay 🚀`
                        )
                );

            return interaction.reply({
                components: [new ContainerBuilder().setComponents(container)]
            });
        }
    }
};
