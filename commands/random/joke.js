const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const fetch = require('node-fetch');

const SUBREDDITS = {
    dad: 'dadjokes',
    mom: 'YourMomsJokes',
    funny: 'Jokes'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Get a random joke')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of joke')
                .setRequired(true)
                .addChoices(
                    { name: 'Dad Joke', value: 'dad' },
                    { name: 'Mom Joke', value: 'mom' },
                    { name: 'Funny Joke', value: 'funny' }
                )),

    async execute(interaction) {
        const type = interaction.options.getString('type');
        const subreddit = SUBREDDITS[type];

        await interaction.deferReply();

        try {
            const response = await fetch(`https://www.reddit.com/r/${subreddit}/random/.json`);
            const data = await response.json();

            if (!data[0]?.data?.children?.[0]?.data) {
                return interaction.editReply({
                    content: 'Failed to fetch a joke. Please try again!',
                    Flags: 64
                });
            }

            const joke = data[0].data.children[0].data;

            if (joke.over_18) {
                return interaction.editReply({
                    content: 'Found an inappropriate joke. Please try again!',
                    Flags: 64
                });
            }

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## 😄 Random ${type.charAt(0).toUpperCase() + type.slice(1)} Joke\n\n` +
                            `### ${joke.title.replace(/\[.*?\]/g, '').trim()}\n` +
                            (joke.selftext ? `\n${joke.selftext}\n` : '') +
                            `\n*From r/${subreddit}*`
                        )
                );

            await interaction.editReply({
                components: [container]
            });

        } catch (error) {
            console.error('Error fetching joke:', error);
            await interaction.editReply({
                content: 'Failed to fetch a joke. Please try again!',
                Flags: 64
            });
        }
    }
};