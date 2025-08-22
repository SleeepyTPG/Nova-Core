const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder } = require("discord.js");
const fetch = require("node-fetch");
require("dotenv").config();

const SUBREDDITS = {
    dad: "dadjokes",
    mom: "YourMomsJokes",
    funny: "Jokes"
};

let cachedToken = null;
let tokenExpiry = 0;

async function getRedditToken() {
    const now = Date.now();

    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    const auth = Buffer.from(
        `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "password",
            username: process.env.REDDIT_USERNAME,
            password: process.env.REDDIT_PASSWORD
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = now + data.expires_in * 1000;

    return cachedToken;
}

async function fetchJoke(subreddit) {
    const token = await getRedditToken();

    const res = await fetch(`https://oauth.reddit.com/r/${subreddit}/random`, {
        headers: {
            "Authorization": `bearer ${token}`,
            "User-Agent": "NovaCoreBot/1.0.0 (by u/DEINUSERNAME)"
        }
    });

    if (!res.ok) {
        throw new Error(`Reddit API error: ${res.status}`);
    }

    const data = await res.json();
    return data[0]?.data?.children[0]?.data;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("joke")
        .setDescription("Get a random joke")
        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("Type of joke")
                .setRequired(true)
                .addChoices(
                    { name: "Dad Joke", value: "dad" },
                    { name: "Mom Joke", value: "mom" },
                    { name: "Funny Joke", value: "funny" }
                )
        ),

    async execute(interaction) {
        const type = interaction.options.getString("type");
        const subreddit = SUBREDDITS[type];

        await interaction.deferReply();

        try {
            const joke = await fetchJoke(subreddit);

            if (!joke) {
                return interaction.editReply({
                    content: "❌ Konnte keinen Witz finden, bitte nochmal probieren."
                });
            }

            if (joke.over_18) {
                return interaction.editReply({
                    content: "⚠️ Der Witz ist NSFW. Versuch es nochmal!"
                });
            }

            const container = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 😄 Random ${type.charAt(0).toUpperCase() + type.slice(1)} Joke\n\n` +
                    `### ${joke.title.replace(/\[.*?\]/g, "").trim()}\n` +
                    (joke.selftext ? `\n${joke.selftext}\n` : "") +
                    `\n*From r/${subreddit}*`
                )
            );

            await interaction.editReply({
                components: [container]
            });

        } catch (error) {
            console.error("Error fetching joke:", error);
            await interaction.editReply({
                content: "❌ Fehler beim Abrufen eines Witzes."
            });
        }
    }
};
