const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require("discord.js");

let incidents = {};
let incidentCounter = 1;

function formatStatus(status) {
  switch (status) {
    case "open":
      return "❌ **Status:** Open";
    case "investigating":
      return "🔎 **Status:** Investigating";
    case "resolved":
      return "✅ **Status:** Resolved";
    default:
      return "⚪ **Status:** Unknown";
  }
}

function buildIncidentContainer(incident) {
  const logLines = incident.logs
    .map((log) => `[${log.time}] <@${log.user}>: ${log.message}`)
    .join("\n");

  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `## 🚨 [Incident #${incident.id}]\n\n` +
        `**${incident.title}**\n\n${incident.details}\n\n` +
        formatStatus(incident.status) +
        `\n\n📜 **Update Log:**\n${logLines}`
    )
  );

  return new ContainerBuilder()
    .addComponents(section)
    .addComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("incident")
    .setDescription("Manage incidents (developer only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new incident.")
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Title of the incident").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("details").setDescription("Details about the incident").setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to post the incident in")
            .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption((opt) =>
          opt.setName("ping").setDescription("Role to ping when posting (optional)")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("update")
        .setDescription("Update an incident.")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Incident ID").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("status").setDescription("New status").addChoices(
            { name: "Open", value: "open" },
            { name: "Investigating", value: "investigating" },
            { name: "Resolved", value: "resolved" }
          )
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Log message to add")
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to post update in (optional)")
            .addChannelTypes(ChannelType.GuildText)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const title = interaction.options.getString("title");
      const details = interaction.options.getString("details");
      const targetChannel = interaction.options.getChannel("channel");
      const pingRole = interaction.options.getRole("ping");

      const id = incidentCounter++;
      const incident = {
        id,
        title,
        details,
        status: "open",
        logs: [
          {
            time: new Date().toLocaleString(),
            user: interaction.user.id,
            message: "Incident created.",
          },
        ],
      };
      incidents[id] = incident;

      const container = buildIncidentContainer(incident);
      const content = pingRole ? `${pingRole}` : null;

      if (targetChannel) {
        await targetChannel.send({
          content,
          components: [container],
        });
        return interaction.reply({
          content: `✅ Incident #${id} created in ${targetChannel}`,
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content,
          components: [container],
        });
      }
    }

    if (sub === "update") {
      const id = interaction.options.getInteger("id");
      const newStatus = interaction.options.getString("status");
      const logMessage = interaction.options.getString("message");
      const targetChannel = interaction.options.getChannel("channel");

      const incident = incidents[id];
      if (!incident) {
        return interaction.reply({
          content: `❌ Incident #${id} not found.`,
          ephemeral: true,
        });
      }

      if (newStatus) incident.status = newStatus;
      if (logMessage) {
        incident.logs.push({
          time: new Date().toLocaleString(),
          user: interaction.user.id,
          message: logMessage,
        });
      }

      const container = buildIncidentContainer(incident);

      if (targetChannel) {
        await targetChannel.send({
          content: `🔄 **Incident #${id} Updated**`,
          components: [container],
        });
        return interaction.reply({
          content: `✅ Incident #${id} update posted in ${targetChannel}`,
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: `🔄 **Incident #${id} Updated**`,
          components: [container],
        });
      }
    }
  },
};
