const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const welcomeStore = require('../utils/welcomeStore');

module.exports = [
  {
    name: Events.GuildMemberAdd,
    async execute(member) {
      const channelId = welcomeStore.getWelcomeChannel(member.guild.id);
      if (!channelId) return;
      const channel = member.guild.channels.cache.get(channelId);
      if (!channel) return;

      await channel.send({
        content: `👋 Welcome to the server, ${member}!`
      });
    }
  },
  {
    name: Events.InteractionCreate,
    async execute(interaction) {
      if (!interaction.isButton()) return;
      if (interaction.customId !== 'test_welcome') return;

      const channelId = welcomeStore.getWelcomeChannel(interaction.guild.id);
      if (!channelId) {
        await interaction.reply({ content: 'No welcome channel set.', ephemeral: true });
        return;
      }
      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel) {
        await interaction.reply({ content: 'Welcome channel not found.', ephemeral: true });
        return;
      }

      await channel.send({ content: `👋 (Test) Welcome to the server, ${interaction.user}!` });
      await interaction.reply({ content: 'Test welcome message sent!', ephemeral: true });
    }
  }
];