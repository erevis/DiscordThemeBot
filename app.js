require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const pool = require('./db');
const ytdl = require("discord-ytdl-core");
const embedTmp = require('./embed-temp.js');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = Discord = require('discord.js');
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
} = require('@discordjs/voice');

const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ]
});

const player = createAudioPlayer();
var playingAudio = function() {};
var timer;

// Command initialization
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  	const filePath = path.join(commandsPath, file);
  	const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`Discord API Initialized, Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    // if (interaction.isButton()) {
    //     try {
    //         const command = client.commands.get("set");
    //         console.log(interaction);
    //     } catch (err) {
    //         console.error(err);
    //         await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    //     }
    // }

    if (!interaction.isChatInputCommand()) return;

  	const command = client.commands.get(interaction.commandName);

  	if (!command) return;

  	try {
        await command.execute(interaction);
  	} catch (err) {
    	console.error(err);
    	await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  	}
});

player.on(AudioPlayerStatus.Playing, () => {
    playingAudio();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const newChannelID = newState.channelId;
    const oldChannelID = oldState.channelId;
    const member = newState.member;
    const user = member.user;
    const username = user.username;
    const channel = member.voice.channel;

    if (oldChannelID == null && newChannelID != null && username != 'Music Theme Bot') {
        console.log(username + " has joined voice channel " + channel);

        try {
            const result = await getLink(user.id);

            if (result[0][0] === undefined) throw "Link not found"
            console.log("Link found")
            const link = result[0][0].Link;
            const start = result[0][0].Start;
            const duration = result[0][0].Duration;
            const enabled = result[0][0].Enabled;
            const alerted = result[0][0].Alerted

            if (enabled == 'T') {
                const stream = ytdl(link, {
                    filter: "audioonly",
                    seek: start,
                    opusEncoded: true
                });

                const connection = await connectToChannel(channel);
                const subscription = connection.subscribe(player);

                console.log("Music Theme Bot has joined " + channel)

                clearTimeout(timer);
                playingAudio = function() {
                    console.log(username + ' is now playing a theme!');
                    timer = setTimeout(() => {
                        // unsubscribe fades audio out
                        subscription.unsubscribe();
                        setTimeout(() => {
                            // after fade, destroy connection
							try {
								connection.destroy();
							} catch (err) {
								// NOTE: instead of catching error, try to check if connection has already been destroyed.
								console.error("*** Voice connection already destroyed");
							}
                        }, 500)
                    }, duration * 1000)
                }

                playSong(stream)

                // pool.query(
                //     'update users set alerted=? where id=?',
                //     ['F', user.id]
                // );
            }
        } catch(err) {
            console.error(err);
        }
    } else if (newChannelID == null) {
        // console.log(username + " has left voice channel " + oldChannelID);
    } else {
        // console.log(user + " muted or switched channels");
    };
});

async function getLink(id) {
    console.log("Fetching youtube link...")

    return await pool.execute('select * from users where id = ?',
    [id]);
}

async function connectToChannel(channel) {
    const connection = joinVoiceChannel({
    	channelId: channel.id,
    	guildId: channel.guild.id,
    	adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
        return connection;
    } catch (err) {
        connection.destroy();
        throw err;
    }
}

function playSong(audio) {
    player.play(
        createAudioResource(
            audio
        )
    )
    console.log("Loading audio...");
}

client.login(process.env.BOT_TOKEN);
