const welcomeChannels = {};

module.exports = {
  setWelcomeChannel(guildId, channelId) {
    welcomeChannels[guildId] = channelId;
  },
  getWelcomeChannel(guildId) {
    return welcomeChannels[guildId] || null;
  }
};