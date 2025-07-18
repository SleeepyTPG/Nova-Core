const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete a specified number of messages from the current channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (2-100)')
                .setRequired(true)),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        if (!interaction.member.permissions.has('ManageMessages')) {
            return interaction.reply({ content: 'You do not have permission to manage messages.', Flags: 64 });
        }

        if (amount < 2 || amount > 100) {
            return interaction.reply({ content: 'Please specify a number between 2 and 100.', Flags: 64 });
        }

        try {
            await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `🧹 Deleted ${amount} messages.`, Flags: 64 });
        } catch (error) {
            await interaction.reply({ content: 'Failed to delete messages. I can only delete messages younger than 14 days.', Flags: 64 });
        }
    }
};