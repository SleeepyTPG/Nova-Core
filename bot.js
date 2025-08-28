require('dotenv').config();

const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logAction } = require('./commands/util/logger');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.User,
        Partials.Message,
        Partials.GuildMember,
        Partials.ThreadMember
    ]
});

client.commands = new Collection();
const commands = [];

console.log('Loading commands...');
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(folder => {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    console.log(`📁 Loading ${folder} commands...`);
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`⚠️ Command at ${filePath} missing required properties!`);
        }
    }
});

async function deployCommands() {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error('Error executing command:', error);
        const errorMessage = {
            content: 'There was an error executing that command.',
            Flags: 64
        };
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(errorMessage);
        } else {
            await interaction.followUp(errorMessage);
        }
    }
});

client.once('ready', async () => {
    console.log(`🤖 ${client.user.tag} is online!`);
    console.log('Discord.js version:', require('discord.js').version);
    console.log(`Node.js version: ${process.version}`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);

    client.user.setActivity("Developing... | discord.gg/cSYe7NFrnR", {
    type: Discord.ActivityType.Watching
    }
);
    
    await deployCommands();
});

client.on('error', error => console.error('Client error:', error));
process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));

client.login(process.env.BOT_TOKEN).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});

client.on('guildMemberAdd', async member => {
    await logAction(
        { guild: member.guild },
        '👋 Member Joined',
        [
            `**User:** ${member.user.tag} (${member.id})`,
            `**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
            `**Joined:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ]
    );
});

client.on('guildMemberRemove', async member => {
    await logAction(
        { guild: member.guild },
        '👋 Member Left',
        [
            `**User:** ${member.user.tag} (${member.id})`,
            `**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
            `**Left:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ]
    );
});

client.on('guildBanAdd', async ban => {
    await logAction(
        { guild: ban.guild },
        '🔨 Member Banned',
        [
            `**User:** ${ban.user.tag} (${ban.user.id})`,
            `**Banned:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ]
    );
});

client.on('guildBanRemove', async ban => {
    await logAction(
        { guild: ban.guild },
        '✅ Member Unbanned',
        [
            `**User:** ${ban.user.tag} (${ban.user.id})`,
            `**Unbanned:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ]
    );
});

client.on('messageDelete', async message => {
    if (!message.guild || message.partial || message.system) return;
    await logAction(
        { guild: message.guild },
        '🗑️ Message Deleted',
        [
            `**Channel:** <#${message.channel.id}>`,
            `**Author:** ${message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown'}`,
            `**Content:**\n${message.content || '*No content*'}`,
            `**Deleted:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ]
    );
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.partial || newMessage.partial || oldMessage.system) return;
    if (oldMessage.content === newMessage.content) return;
    await logAction(
        { guild: oldMessage.guild },
        '✏️ Message Edited',
        [
            `**Channel:** <#${oldMessage.channel.id}>`,
            `**Author:** ${oldMessage.author ? `${oldMessage.author.tag} (${oldMessage.author.id})` : 'Unknown'}`,
            `**Before:**\n${oldMessage.content || '*No content*'}`,
            `**After:**\n${newMessage.content || '*No content*'}`,
            `**Edited:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ]
    );
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (!oldState.guild) return;
    const user = newState.member ? newState.member.user : oldState.member.user;
    let action = null;
    let details = [];

    if (!oldState.channel && newState.channel) {
        action = '🔊 Voice Join';
        details = [
            `**User:** ${user.tag} (${user.id})`,
            `**Channel:** ${newState.channel.name}`,
            `**Joined:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ];
    } else if (oldState.channel && !newState.channel) {
        action = '🔇 Voice Leave';
        details = [
            `**User:** ${user.tag} (${user.id})`,
            `**Channel:** ${oldState.channel.name}`,
            `**Left:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ];
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        action = '🔄 Voice Move';
        details = [
            `**User:** ${user.tag} (${user.id})`,
            `**From:** ${oldState.channel.name}`,
            `**To:** ${newState.channel.name}`,
            `**Moved:** <t:${Math.floor(Date.now() / 1000)}:F>`
        ];
    }

    if (action) {
        await logAction(
            { guild: oldState.guild },
            action,
            details
        );
    }
});