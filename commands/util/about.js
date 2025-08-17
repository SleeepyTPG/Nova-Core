const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeperatorBuilder } = require('discord.js');
const { version } = require('../../package.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Display information about Nova Core bot'),

    async execute(interaction) {
        const client = interaction.client;
        const guilds = client.guilds.cache.size;
        const users = client.users.cache.size;
        const commands = client.commands.size;
        const uptime = Math.floor(client.uptime / 1000);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`# 🤖 Nova Core Bot\n*Your powerful Discord companion*`)
            )
            .addSeperatorComponents(
                new SeperatorBuilder()
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## 📊 Statistics\n` +
                        `> **Servers:** ${guilds}\n` +
                        `> **Users:** ${users}\n` +
                        `> **Commands:** ${commands}\n` +
                        `> **Uptime:** <t:${Math.floor(Date.now()/1000) - uptime}:R>`
                    )
            )
            .addSeperatorComponents(
                new SeperatorBuilder()
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## 💻 Technical Info\n` +
                        `> **Version:** ${version || '0.8.4'}\n` +
                        `> **Discord.js:** ${require('discord.js').version}\n` +
                        `> **Node.js:** ${process.version}`
                    )
            )
            .addSeperatorComponents(
                new SeperatorBuilder()
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## 🔗 Links\n` +
                        `> **Support Server:** [Join Here](https://discord.gg/z4C6T5m88D)\n` +
                        `> **Invite Bot:** [Add to Server](https://discord.com/oauth2/authorize?client_id=1395883827632668702)\n` +
                        `> **GitHub:** [Repository](https://github.com/SleeepyTPG/Nova-Core)`
                    )
            )
            .addSeperatorComponents(
                new SeperatorBuilder()
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## 👥 Credits\n` +
                        `> **Developer:** Sleeepy\n` +
                        `> **Special Thanks:** The Discord.js Community`
                    )
            );

        await interaction.reply({
            components: [container]
        });
    }
};