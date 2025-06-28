const presetRules = {};
const customRules = {};

module.exports = {
  setPresetRule(guildId, rule, enabled) {
    if (!presetRules[guildId]) presetRules[guildId] = {};
    presetRules[guildId][rule] = enabled;
  },
  getPresetRules(guildId) {
    return presetRules[guildId] || {};
  },
  addCustomRule(guildId, rule) {
    if (!customRules[guildId]) customRules[guildId] = [];
    customRules[guildId].push(rule);
  },
  getCustomRules(guildId) {
    return customRules[guildId] || [];
  }
}