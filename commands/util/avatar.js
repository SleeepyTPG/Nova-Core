const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get the avatar of a user or the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get the avatar of')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('server')
                .setDescription('Show the server icon')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const showServer = interaction.options.getBoolean('server');

        if (showServer) {
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setTitle(`Server Icon: ${guild.name}`)
                .setImage(guild.iconURL({ size: 1024 }))
                .setColor(0x7289da)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed] });
        }

        const targetUser = user || interaction.user;
        const embed = new EmbedBuilder()
            .setTitle(`Avatar of ${targetUser.tag}`)
            .setImage(targetUser.displayAvatarURL({ size: 1024, dynamic: true }))
            .setColor(0x7289da)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed]
        });
    }
};