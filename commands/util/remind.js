const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder for yourself')
        .addStringOption(option => 
            option.setName('time')
                .setDescription('When to remind you (e.g. 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('What to remind you about')
                .setRequired(true)),

    async execute(interaction) {
        const timeStr = interaction.options.getString('time');
        const message = interaction.options.getString('message');
        
        const duration = ms(timeStr);
        
        if (!duration || duration < 60000 || duration > 2592000000) {
            return interaction.reply({
                content: 'Please provide a valid time between 1 minute and 30 days (e.g. 1h, 30m, 1d)',
                Flags: 64
            });
        }

        const confirmContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`## ⏰ Reminder Set!\n\n**What:** ${message}\n**When:** <t:${Math.floor((Date.now() + duration) / 1000)}:R>`)
            );

        await interaction.reply({ 
            components: [confirmContainer],
            Flags: 64
        });

        setTimeout(async () => {
            try {
                const reminderContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(`## 🔔 Reminder!\n\n**Message:** ${message}\n**Set:** <t:${Math.floor(Date.now() / 1000)}:R>`)
                    );

                await interaction.user.send({ 
                    content: `<@${interaction.user.id}>`,
                    components: [reminderContainer] 
                });
            } catch (error) {
                console.error('Failed to send reminder:', error);
            }
        }, duration);
    },
};