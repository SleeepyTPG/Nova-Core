const {
    SlashCommandBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ContainerBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('v2builder')
        .setDescription('Create a custom Container v2 message')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new container message')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The title of your message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('The main content (supports markdown)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('image')
                        .setDescription('URL of an image to include')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('separator')
                        .setDescription('Add separators between sections')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('footer')
                        .setDescription('Optional footer text')
                        .setRequired(false))),

    async execute(interaction) {
        try {
            const title = interaction.options.getString('title');
            const content = interaction.options.getString('content');
            const imageUrl = interaction.options.getString('image');
            const useSeparator = interaction.options.getBoolean('separator') ?? true;
            const footer = interaction.options.getString('footer');

            const sep = () => new SeparatorBuilder().setSpacing("Small");
            const container = new ContainerBuilder();

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`# ${title}`)
            );

            if (useSeparator) {
                container.addSeparatorComponents(sep());
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(content)
            );

            if (imageUrl) {
                if (useSeparator) {
                    container.addSeparatorComponents(sep());
                }
                container.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`![](${imageUrl})`)
                );
            }

            if (footer) {
                if (useSeparator) {
                    container.addSeparatorComponents(sep());
                }
                container.addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`*${footer}*`)
                );
            }

            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            });

        } catch (error) {
            console.error('Error in v2builder command:', error);
            await interaction.reply({
                content: 'An error occurred while creating your container message.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};