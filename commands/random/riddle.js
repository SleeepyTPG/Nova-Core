const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const fetch = require('node-fetch');

const SUBREDDITS = {
    easy: 'easyriddles',
    hard: 'riddles',
    superhard: 'hardriddles'
};

const activeRiddles = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('riddle')
        .setDescription('Get a riddle or answer one')
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Get a new riddle')
                .addStringOption(option =>
                    option.setName('difficulty')
                        .setDescription('Choose riddle difficulty')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Easy', value: 'easy' },
                            { name: 'Hard', value: 'hard' },
                            { name: 'Super Hard', value: 'superhard' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('answer')
                .setDescription('Submit your answer to the active riddle')
                .addStringOption(option =>
                    option.setName('answer')
                        .setDescription('Your answer')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'get') {
            const difficulty = interaction.options.getString('difficulty');
            const subreddit = SUBREDDITS[difficulty];

            await interaction.deferReply();

            try {
                const response = await fetch(`https://www.reddit.com/r/${subreddit}/random/.json`);
                const data = await response.json();

                if (!data[0]?.data?.children?.[0]?.data) {
                    return interaction.editReply({
                        content: 'Failed to fetch a riddle. Please try again!',
                        Flags: 64
                    });
                }

                const post = data[0].data.children[0].data;
                const riddle = post.title.replace(/\[.*?\]/g, '').trim();
                const answer = post.selftext.toLowerCase().trim();

                activeRiddles.set(interaction.user.id, {
                    answer,
                    difficulty,
                    timestamp: Date.now()
                });

                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                `## 🤔 ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Riddle\n\n` +
                                `> ${riddle}\n\n` +
                                `*Use \`/riddle answer\` to submit your answer*`
                            )
                    );

                await interaction.editReply({
                    components: [container]
                });

            } catch (error) {
                console.error('Error fetching riddle:', error);
                await interaction.editReply({
                    content: 'Failed to fetch a riddle. Please try again!',
                    Flags: 64
                });
            }

        } else if (subcommand === 'answer') {
            const userAnswer = interaction.options.getString('answer').toLowerCase().trim();
            const activeRiddle = activeRiddles.get(interaction.user.id);

            if (!activeRiddle) {
                return interaction.reply({
                    content: 'You don\'t have an active riddle! Use `/riddle get` to get one.',
                    Flags: 64
                });
            }

            if (Date.now() - activeRiddle.timestamp > 600000) {
                activeRiddles.delete(interaction.user.id);
                return interaction.reply({
                    content: 'Your riddle has expired! Use `/riddle get` to get a new one.',
                    Flags: 64
                });
            }

            const isCorrect = userAnswer.includes(activeRiddle.answer);
            activeRiddles.delete(interaction.user.id);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            isCorrect ?
                            `## ✅ Correct Answer!\n\n*The answer was:* ${activeRiddle.answer}\n\nWell done solving this ${activeRiddle.difficulty} riddle!` :
                            `## ❌ Wrong Answer!\n\n*The correct answer was:* ${activeRiddle.answer}\n\nBetter luck next time!`
                        )
                );

            await interaction.reply({
                components: [container],
                Flags: 64
            });
        }
    }
};