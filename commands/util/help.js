const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get a list of available commands and their descriptions.'),
    async execute(interaction) {
        const commands = interaction.client.commands;
        const commandsByCategory = new Map();

        commands.forEach(command => {
            if (command.data) {
                const category = command.data.category || 'Miscellaneous';
                if (!commandsByCategory.has(category)) {
                    commandsByCategory.set(category, []);
                }
                commandsByCategory.get(category).push({
                    name: command.data.name,
                    description: command.data.description,
                });
            }
        });

        let commandList = '';
        for (const [category, cmds] of commandsByCategory) {
            commandList += `### ${category}\n`;
            cmds.forEach(cmd => {
                commandList += `> **/${cmd.name}** - ${cmd.description}\n`;
            });
            commandList += '\n';
        }

        const helpEmbed = new EmbedBuilder()
            .setTitle('📜 Nova Core Commands')
            .setDescription('*A powerful Discord bot with various features*\n\n' + commandList)
            .setColor(0x3498db)
            .setFooter({ text: 'Need Help? Join our support server: discord.gg/z4C6T5m88D' });

        await interaction.reply({ embeds: [helpEmbed] });
    }
};