const { Events } = require('discord.js');
const customRulesStore = require('../utils/customRulesStore');

const spamTracker = new Map();

const SPAM_TIME_WINDOW = 7000;
const SPAM_MESSAGE_LIMIT = 5;
const SPAM_MUTE_DURATION = 60_000;

const badWords = [
  'idiot', 'stupid', 'dumb', 'loser', 'moron', 'trash', 'noob', 'retard', 'hate you', 'nigger', 'nigga',
  'kill yourself', 'kys', 'worthless', 'useless', 'shut up', 'shutup', 'die', 'freak',
  'bastard', 'bitch', 'asshole', 'fuck', 'shit', 'cunt', 'dick', 'pussy', 'slut', 'whore'
];

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    const presets = customRulesStore.getPresetRules(guildId);

    if (presets['anti-spam']) {
      const now = Date.now();
      if (!spamTracker.has(guildId)) spamTracker.set(guildId, new Map());
      const guildSpam = spamTracker.get(guildId);

      if (!guildSpam.has(userId)) guildSpam.set(userId, []);
      const timestamps = guildSpam.get(userId);

      timestamps.push(now);

      while (timestamps.length && now - timestamps[0] > SPAM_TIME_WINDOW) {
        timestamps.shift();
      }

      if (timestamps.length > SPAM_MESSAGE_LIMIT) {
        await message.delete().catch(() => {});
        if (message.member && message.member.moderatable) {
          await message.member.timeout(SPAM_MUTE_DURATION, 'Automod: Spam detected').catch(() => {});
          await message.channel.send(`${message.author}, you have been muted for spamming.`);
        } else {
          await message.channel.send(`${message.author}, please do not spam.`);
        }
        guildSpam.set(userId, []);
        return;
      }
    }

    if (presets['anti-link']) {
      if (/(https?:\/\/|discord\.gg\/)/i.test(message.content)) {
        await message.delete().catch(() => {});
        await message.channel.send(`${message.author}, links are not allowed.`);
        return;
      }
    }

    if (presets['anti-profanity']) {
      if (badWords.some(w => message.content.toLowerCase().includes(w))) {
        await message.delete().catch(() => {});
        await message.channel.send(`${message.author}, please do not use degrading or profane language.`);
        return;
      }
    }

    if (presets['anti-mention']) {
      if (message.mentions.users.size > 5) {
        await message.delete().catch(() => {});
        await message.channel.send(`${message.author}, too many mentions!`);
        return;
      }
    }

    if (presets['anti-caps']) {
      const caps = message.content.replace(/[^A-Z]/g, '').length;
      if (caps > 20 && caps > message.content.length / 2) {
        await message.delete().catch(() => {});
        await message.channel.send(`${message.author}, please do not use excessive caps.`);
        return;
      }
    }

    const customRules = customRulesStore.getCustomRules(guildId);
    for (const rule of customRules) {
      if (message.content.toLowerCase().includes(rule.trigger.toLowerCase())) {
        if (rule.action === 'block') {
          await message.delete().catch(() => {});
        } else if (rule.action === 'warn') {
          await message.reply('⚠️ Please avoid using that word/phrase.');
        } else if (rule.action === 'timeout') {
          if (message.member && message.member.moderatable) {
            await message.member.timeout(60_000, 'Automod: Custom rule triggered').catch(() => {});
          }
        }
        break;
      }
    }
  }
};