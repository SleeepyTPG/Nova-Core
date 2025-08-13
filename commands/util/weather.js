const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder } = require('discord.js');

const COMMAND_ENABLED = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('🔨 Currently under maintenance - Weather forecast command')
        .addStringOption(option =>
            option.setName('location')
                .setDescription('City name or location')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days for forecast (1-5)')
                .setRequired(false)
                .addChoices(
                    { name: '1 Day', value: 1 },
                    { name: '3 Days', value: 3 },
                    { name: '5 Days', value: 5 }
                )),

    async execute(interaction) {
        if (!COMMAND_ENABLED) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent('## 🛠️ Command Under Maintenance\n> This command is currently being configured.\n> Please try again later.')
                );

            return interaction.reply({
                components: [container],
                Flags: 64
            });
        }

        await interaction.reply({ 
            content: 'This command is currently disabled.',
            Flags: 64
        });
    },
};