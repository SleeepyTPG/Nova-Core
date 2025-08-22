const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder 
} = require('discord.js');
const fetch = require('node-fetch');

const redditEndpoints = {
    games: 'https://www.reddit.com/r/gamingmemes/top.json?limit=50&t=week',
    films: 'https://www.reddit.com/r/moviememes/top.json?limit=50&t=week',
    real_life: 'https://www.reddit.com/r/memes/top.json?limit=50&t=week'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random meme from a category!')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Choose a meme category')
                .setRequired(true)
                .addChoices(
                    { name: 'Games', value: 'games' },
                    { name: 'Films', value: 'films' },
                    { name: 'Real Life', value: 'real_life' }
                )),
    async execute(interaction) {
        const category = interaction.options.getString('category');
        const endpoint = redditEndpoints[category];

        await interaction.deferReply();

        try {
            const response = await fetch(endpoint, {
                headers: { 'User-Agent': 'DiscordBot' }
            });
            const data = await response.json();

            const posts = data.data.children.filter(post =>
                post.data.post_hint === 'image' && !post.data.over_18
            );

            if (posts.length === 0) {
                return interaction.editReply({ content: 'No memes found for this category right now. Try again later!' });
            }

            const meme = posts[Math.floor(Math.random() * posts.length)].data;

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `## 😂 Meme from r/${meme.subreddit}\n` +
                            `[View on Reddit](https://reddit.com${meme.permalink})\n\n` +
                            `![Meme Image](${meme.url})`
                        )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                        .setSpacing("Small")
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `> 👍 **${meme.ups}** upvotes\n` +
                            `*Requested by ${interaction.user.tag}*`
                        )
                );

            await interaction.editReply({ components: [container] });
        } catch (error) {
            await interaction.editReply({ content: 'Failed to fetch memes. Please try again later.' });
        }
    }
};