const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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

function formatStatus(status) {
  if (status === "ongoing") return "🔴 Monitoring / Implementing Fix";
  if (status === "resolved") return "🟢 Resolved";
  if (status === "new") return "⚫️ New Incident";
  return "❔ Unknown Status";
}

function getStatusColor(status) {
  switch (status) {
    case "ongoing": return 0xFF0000;
    case "resolved": return 0x00FF00;
    case "new": return 0x808080;
    default: return 0xFFFF00;
  }
}

function discordTime(ms, format = 'f') {
  return `<t:${Math.floor(ms / 1000)}:${format}>`;
}

function buildIncidentEmbed(incident) {
  const logLines = incident.logs
    .map(log => `[${discordTime(log.time, 'f')}] <@${log.user}>: ${log.message}`)
    .join("\n") || "No logs yet.";

  return new EmbedBuilder()
    .setTitle(`🚨 Incident #${incident.id}: ${incident.title}`)
    .setDescription(incident.details)
    .addFields(
      { name: "Status", value: formatStatus(incident.status), inline: true },
      { name: "Created", value: discordTime(incident.created, 'f'), inline: true },
      { name: "Update Log", value: logLines }
    )
    .setColor(getStatusColor(incident.status))
    .setTimestamp();
}

function buildIncidentButtons(incident) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pingme_${incident.id}`)
        .setLabel("Ping Me")
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("incident")
    .setDescription("Manage incidents (developer-only)")
    .addSubcommand(sub =>
      sub
        .setName("create")
        .setDescription("Create a new incident")
        .addStringOption(opt =>
          opt.setName("title").setDescription("Incident title").setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName("details").setDescription("Details about the incident").setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName("status")
            .setDescription("Initial incident status")
            .addChoices(
              { name: "🔴 Monitoring / Implementing Fix", value: "ongoing" },
              { name: "🟢 Resolved", value: "resolved" },
              { name: "⚫️ New Incident", value: "new" }
            )
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName("channel").setDescription("Where to post the incident")
        )
        .addRoleOption(opt =>
          opt.setName("pingrole")
            .setDescription("Role to ping when creating the incident")
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("update")
        .setDescription("Update an existing incident")
        .addIntegerOption(opt =>
          opt.setName("id").setDescription("Incident ID").setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName("status")
            .setDescription("New status")
            .addChoices(
              { name: "🔴 Monitoring / Implementing Fix", value: "ongoing" },
              { name: "🟢 Resolved", value: "resolved" },
              { name: "⚫️ New Incident", value: "new" }
            )
        )
        .addStringOption(opt =>
          opt.setName("message").setDescription("Additional log message")
        )
        .addChannelOption(opt =>
          opt.setName("channel").setDescription("Where to post the update (fallback)")
        )
    ),

  async execute(interaction) {
    if (!DEVELOPER_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: "❌ This command is developer-only.", ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      const title = interaction.options.getString("title");
      const details = interaction.options.getString("details");
      const status = interaction.options.getString("status");
      const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
      const pingRole = interaction.options.getRole("pingrole");

      const incidentId = Object.keys(incidents).length + 1;
      const now = Date.now();

      incidents[incidentId] = {
        id: incidentId,
        title,
        details,
        status,
        created: now,
        logs: [{ time: now, user: interaction.user.id, message: "Incident created." }],
        subscribers: []
      };
      saveIncidents();

      const embed = buildIncidentEmbed(incidents[incidentId]);
      const buttons = buildIncidentButtons(incidents[incidentId]);

      let content = `📢 **New Incident #${incidentId}**`;
      if (pingRole) content = `${pingRole} ${content}`;

      const sentMessage = await targetChannel.send({ content, embeds: [embed], components: buttons });

      incidents[incidentId].messageId = sentMessage.id;
      incidents[incidentId].channelId = targetChannel.id;
      saveIncidents();

      return interaction.reply({ content: `✅ Incident #${incidentId} posted in ${targetChannel}`, ephemeral: true });
    }

    if (subcommand === "update") {
      const id = interaction.options.getInteger("id");
      const newStatus = interaction.options.getString("status");
      const message = interaction.options.getString("message");
      const fallbackChannel = interaction.options.getChannel("channel");
      const now = Date.now();

      const incident = incidents[id];
      if (!incident) return interaction.reply({ content: `❌ Incident #${id} not found.`, ephemeral: true });

      if (newStatus) incident.status = newStatus;
      if (message) incident.logs.push({ time: now, user: interaction.user.id, message });
      saveIncidents();

      const embed = buildIncidentEmbed(incident);
      const buttons = buildIncidentButtons(incident);

      try {
        let channel = fallbackChannel;
        if (incident.channelId) {
          channel = await interaction.client.channels.fetch(incident.channelId);
        }

        if (!channel) return interaction.reply({ content: "❌ Could not find incident channel.", ephemeral: true });

        if (incident.messageId) {
          const msg = await channel.messages.fetch(incident.messageId);
          if (msg) await msg.edit({ embeds: [embed], components: buttons });

          if (newStatus === "resolved" && incident.subscribers?.length) {
            const thread = await msg.startThread({
              name: `Incident #${incident.id} Resolved`,
              autoArchiveDuration: 60,
              reason: "Incident resolved notification"
            });

            const mentions = incident.subscribers.map(id => `<@${id}>`).join(' ');
            await thread.send({ content: `✅ Incident #${incident.id} resolved! Notifying: ${mentions}` });

            incident.subscribers = [];
            saveIncidents();
          }
        } else {
          const sentMessage = await channel.send({ embeds: [embed], components: buttons });
          incident.messageId = sentMessage.id;
          incident.channelId = channel.id;
          saveIncidents();
        }
      } catch (err) {
        console.error("Failed to update incident:", err);
      }

      return interaction.reply({ content: `✅ Incident #${id} updated.`, ephemeral: true });
    }
  }
};

module.exports.handleButton = async (interaction) => {
  if (!interaction.isButton()) return;

  try {
    const customId = interaction.customId;

    if (customId.startsWith('pingme_')) {
      const incidentId = customId.split('_')[1];
      const incident = incidents[incidentId];
      if (!incident) return await interaction.followUp({ content: "❌ Incident not found.", ephemeral: true });

      if (!incident.subscribers) incident.subscribers = [];

      if (!incident.subscribers.includes(interaction.user.id)) {
        incident.subscribers.push(interaction.user.id);
        saveIncidents();
        await interaction.deferUpdate();
        await interaction.followUp({ content: "✅ You will be notified when this incident is resolved.", ephemeral: true });
      } else {
        await interaction.deferUpdate();
        await interaction.followUp({ content: "ℹ️ You are already subscribed to this incident.", ephemeral: true });
      }
    } else {
      await interaction.deferUpdate();
    }
  } catch (err) {
    console.error("Button interaction error:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate();
    }
  }
};
