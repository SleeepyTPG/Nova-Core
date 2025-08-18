require('dotenv').config();

const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    
    await deployCommands();
});

client.on('error', error => console.error('Client error:', error));
process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));

client.login(process.env.BOT_TOKEN).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});