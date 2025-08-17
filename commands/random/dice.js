const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Guess the dice roll (1-6)')
        .addIntegerOption(option =>
            option.setName('guess')
                .setDescription('Your guess (1-6)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(6)),

    async execute(interaction) {
        const guess = interaction.options.getInteger('guess');
        const roll = Math.floor(Math.random() * 6) + 1;
        
        const diceEmojis = {
            1: '⚀',
            2: '⚁',
            3: '⚂',
            4: '⚃',
            5: '⚄',
            6: '⚅'
        };

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## 🎲 Dice Game\n\n` +
                        `Your guess: ${diceEmojis[guess]} (${guess})\n` +
                        `Actual roll: ${diceEmojis[roll]} (${roll})\n\n` +
                        (guess === roll ? 
                            `### 🎉 Congratulations!\n` +
                            `You guessed correctly!` :
                            `### 😔 Not quite!\n` +
                            `Better luck next time!`)
                    )
            );

        await interaction.reply({
            components: [container]
        });
    }
};