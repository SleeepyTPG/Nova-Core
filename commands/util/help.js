const { SlashCommandBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder } = require('discord.js');

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

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('## 📜 Nova Core Commands\n*A powerful Discord bot with various features*')
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSize(SeparatorSpacingSize.Medium)
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(commandList)
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSize(SeparatorSpacingSize.Medium)
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('### ❓ Need Help? Or found Bugs?\n\nJoin our support server: [NovaCore Support](https://discord.gg/z4C6T5m88D)')
            );

        await interaction.reply({ components: [container] });
    }
};