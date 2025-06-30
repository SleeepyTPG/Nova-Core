const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const welcomeStore = require('../utils/welcomeStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcomechannel')
    .setDescription('Set or view the welcome channel for new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to set as the welcome channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    if (channel) {
      welcomeStore.setWelcomeChannel(guildId, channel.id);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('test_welcome')
          .setLabel('Send Test Welcome')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        content: `✅ Welcome channel set to <#${channel.id}>!`,
        components: [row],
        ephemeral: true
      });
    } else {
      const current = welcomeStore.getWelcomeChannel(guildId);
      if (current) {
        await interaction.reply({ content: `👋 Current welcome channel: <#${current}>`, ephemeral: true });
      } else {
        await interaction.reply({ content: 'No welcome channel set. Use `/welcomechannel <channel>` to set one.', ephemeral: true });
      }
    }
  }
};