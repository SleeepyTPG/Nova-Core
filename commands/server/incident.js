const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const INCIDENTS_PATH = path.join(__dirname, "..", "..", "data", "incidents.json");

if (!fs.existsSync(path.dirname(INCIDENTS_PATH))) {
  fs.mkdirSync(path.dirname(INCIDENTS_PATH), { recursive: true });
}

let incidents = {};
if (fs.existsSync(INCIDENTS_PATH)) {
  incidents = JSON.parse(fs.readFileSync(INCIDENTS_PATH, "utf8"));
}

function saveIncidents() {
  fs.writeFileSync(INCIDENTS_PATH, JSON.stringify(incidents, null, 2));
}

const DEVELOPER_IDS = ["1104736921474834493", ""];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("incident")
    .setDescription("Manage incidents (developer-only)")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new incident")
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Incident title").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("details")
            .setDescription("Details about the incident")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("status")
            .setDescription("Initial incident status")
            .addChoices(
              { name: "🟥 Ongoing", value: "ongoing" },
              { name: "🟩 Resolved", value: "resolved" },
              { name: "🟨 Monitoring", value: "monitoring" }
            )
            .setRequired(true)
        )
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Where to post the incident")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("update")
        .setDescription("Update an existing incident")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Incident ID").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("status")
            .setDescription("New status")
            .addChoices(
              { name: "🟥 Ongoing", value: "ongoing" },
              { name: "🟩 Resolved", value: "resolved" },
              { name: "🟨 Monitoring", value: "monitoring" }
            )
        )
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Additional log message")
        )
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Where to post the update")
        )
    ),

  async execute(interaction) {
    if (!DEVELOPER_IDS.includes(interaction.user.id)) {
      return interaction.reply({
        content: "❌ This command is developer-only.",
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      const title = interaction.options.getString("title");
      const details = interaction.options.getString("details");
      const status = interaction.options.getString("status");
      const targetChannel = interaction.options.getChannel("channel");

      const incidentId = Object.keys(incidents).length + 1;
      const now = new Date().toLocaleString();

      incidents[incidentId] = {
        id: incidentId,
        title,
        details,
        status,
        created: now,
        logs: [
          { time: now, user: interaction.user.id, message: "Incident created." },
        ],
      };
      saveIncidents();

      const container = new ContainerBuilder().addComponents(
        new SectionBuilder().addComponents(
          new TextDisplayBuilder().setContent(
            `## 🚨 [Incident #${incidentId}]\n\n` +
              `**${title}**\n\n${details}\n\n` +
              formatStatus(status) +
              `\n\n🕒 *Created:* ${now}`
          )
        ).addComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        )
      );

      if (targetChannel) {
        await targetChannel.send({
          content: `📢 **New Incident #${incidentId}**`,
          components: [container],
        });
        return interaction.reply({
          content: `✅ Incident #${incidentId} posted in ${targetChannel}`,
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: `📢 **New Incident #${incidentId}**`,
          components: [container],
        });
      }
    }

    if (subcommand === "update") {
      const id = interaction.options.getInteger("id");
      const newStatus = interaction.options.getString("status");
      const message = interaction.options.getString("message");
      const targetChannel = interaction.options.getChannel("channel");
      const now = new Date().toLocaleString();

      const incident = incidents[id];
      if (!incident) {
        return interaction.reply({
          content: `❌ Incident #${id} not found.`,
          ephemeral: true,
        });
      }

      if (newStatus) incident.status = newStatus;
      if (message) {
        incident.logs.push({ time: now, user: interaction.user.id, message });
      }
      saveIncidents();

      const logLines = incident.logs
        .map((log) => `[${log.time}] <@${log.user}>: ${log.message}`)
        .join("\n");

      const container = new ContainerBuilder().addComponents(
        new SectionBuilder().addComponents(
          new TextDisplayBuilder().setContent(
            `## 🚨 [Incident #${incident.id}]\n\n` +
              `**${incident.title}**\n\n${incident.details}\n\n` +
              formatStatus(incident.status) +
              `\n\n📜 **Update Log:**\n${logLines}`
          )
        )
      );

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
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
        });
      }
    }
  },
};

function formatStatus(status) {
  if (status === "ongoing") return "🟥 **Ongoing Incident**";
  if (status === "resolved") return "🟩 **Resolved**";
  if (status === "monitoring") return "🟨 **Monitoring**";
  return "❔ Unknown Status";
}
