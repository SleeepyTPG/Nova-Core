const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const customRulesStore = require('../utils/customRulesStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure automod features for your server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('preset')
        .setDescription('Enable or disable a premade automod rule')
        .addStringOption(opt =>
          opt.setName('rule')
            .setDescription('Select a premade rule')
            .setRequired(true)
            .addChoices(
              { name: 'Anti-Spam', value: 'anti-spam' },
              { name: 'Anti-Link', value: 'anti-link' },
              { name: 'Anti-Profanity', value: 'anti-profanity' },
              { name: 'Anti-Mention Spam', value: 'anti-mention' },
              { name: 'Anti-Caps', value: 'anti-caps' }
            )
        )
        .addBooleanOption(opt =>
          opt.setName('enable')
            .setDescription('Enable or disable this rule')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('custom')
        .setDescription('Create a custom automod rule')
        .addStringOption(opt =>
          opt.setName('trigger')
            .setDescription('Word or phrase to trigger the rule')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('action')
            .setDescription('Action to take (block, warn, timeout)')
            .setRequired(true)
            .addChoices(
              { name: 'Block', value: 'block' },
              { name: 'Warn', value: 'warn' },
              { name: 'Timeout', value: 'timeout' }
            )
        )
    ),

  async execute(interaction) {
    const { options, guild } = interaction;
    const sub = options.getSubcommand();

    if (sub === 'preset') {
      const rule = options.getString('rule');
      const enable = options.getBoolean('enable');

      customRulesStore.setPresetRule(guild.id, rule, enable);

      await interaction.reply({
        content: `Automod rule **${rule.replace('-', ' ')}** has been ${enable ? 'enabled' : 'disabled'}.`,
        ephemeral: true
      });
    }

    if (sub === 'custom') {
      const trigger = options.getString('trigger');
      const action = options.getString('action');

      customRulesStore.addCustomRule(guild.id, { trigger, action });

      await interaction.reply({
        content: `Custom automod rule created: If someone says "**${trigger}**", action: **${action}**.`,
        ephemeral: true
      });
    }
  }
};