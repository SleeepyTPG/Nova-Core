const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "..", "config", "welcome.json");

if (!fs.existsSync(path.dirname(CONFIG_PATH))) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
}

let config = {};
if (fs.existsSync(CONFIG_PATH)) {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function saveConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure the welcome system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setmessage")
        .setDescription("Set the welcome message")
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setDescription(
              "Message with placeholders: %server%, %membercount%, %user%"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("setchannel")
        .setDescription("Set the welcome channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel to send welcome messages to")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (!config[guildId]) {
      config[guildId] = { message: null, channel: null };
    }

    if (sub === "setmessage") {
      const message = interaction.options.getString("message");
      config[guildId].message = message;
      saveConfig();
      return interaction.reply({
        content: `✅ Welcome message set to:\n\`\`\`${message}\`\`\``,
        ephemeral: true,
      });
    }

    if (sub === "setchannel") {
      const channel = interaction.options.getChannel("channel");
      config[guildId].channel = channel.id;
      saveConfig();
      return interaction.reply({
        content: `✅ Welcome channel set to ${channel}`,
        ephemeral: true,
      });
    }
  },

  async onGuildMemberAdd(member) {
    const guildId = member.guild.id;
    if (!config[guildId] || !config[guildId].channel) return;

    const channel = member.guild.channels.cache.get(config[guildId].channel);
    if (!channel) return;

    let msg = config[guildId].message || "Welcome %user% to %server%!";
    msg = msg
      .replace(/%server%/g, member.guild.name)
      .replace(/%membercount%/g, member.guild.memberCount)
      .replace(/%user%/g, `<@${member.id}>`);

    const container = new ContainerBuilder().addComponents(
      new SectionBuilder()
        .addComponents(
          new ThumbnailBuilder()
            .setUrl(
              member.user.displayAvatarURL({ extension: "png", size: 128 })
            )
            .setCircular(true)
        )
        .addComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        )
        .addComponents(new TextDisplayBuilder().setContent(`🎉 ${msg}`))
    );

    await channel.send({ components: [container] });
  },
};
