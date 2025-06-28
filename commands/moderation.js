const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: [
    new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a member from the server')
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption(opt =>
        opt.setName('user')
          .setDescription('User to ban')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('reason')
          .setDescription('Reason for ban')
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member from the server')
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption(opt =>
        opt.setName('user')
          .setDescription('User to kick')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('reason')
          .setDescription('Reason for kick')
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Timeout a member')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(opt =>
        opt.setName('user')
          .setDescription('User to timeout')
          .setRequired(true)
      )
      .addIntegerOption(opt =>
        opt.setName('duration')
          .setDescription('Timeout duration in minutes')
          .setMinValue(1)
          .setMaxValue(10080)
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('reason')
          .setDescription('Reason for timeout')
          .setRequired(false)
      )
  ],

  async execute(interaction) {
    const command = interaction.commandName;
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!member) {
      await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      return;
    }

    if (command === 'ban') {
      if (!member.bannable) {
        await interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });
        return;
      }
      await member.ban({ reason });
      await interaction.reply({ content: `🔨 ${user.tag} has been banned. Reason: ${reason}` });
    }

    if (command === 'kick') {
      if (!member.kickable) {
        await interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });
        return;
      }
      await member.kick(reason);
      await interaction.reply({ content: `👢 ${user.tag} has been kicked. Reason: ${reason}` });
    }

    if (command === 'timeout') {
      if (!member.moderatable) {
        await interaction.reply({ content: 'I cannot timeout this user.', ephemeral: true });
        return;
      }
      const duration = interaction.options.getInteger('duration');
      await member.timeout(duration * 60 * 1000, reason);
      await interaction.reply({ content: `⏳ ${user.tag} has been timed out for ${duration} minute(s). Reason: ${reason}` });
    }
  }
};