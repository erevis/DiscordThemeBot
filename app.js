require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log("Discord API Initialized");
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const newChannelID = newState.channelID;
    const oldChannelID = oldState.channelID;
    const member = newState.member;
    let user = member.user.username;
    let channel = member.voice.channel;
    let fileName = user + ".mp3";
    let exists = false;

    const fs = require("fs"); // Or `import fs from "fs";` with ESM
    if (fs.existsSync('./Sounds/' + fileName)) {
        exists = true;
    }

    console.log("voice update")

    if (oldChannelID == null && newChannelID != null && user != 'Music Theme Bot' && exists) {
        console.log(user + " has joined voice channel with id " + newChannelID);

        const connection = await channel.join();
        connection.voice.setSelfDeaf(true);

        const dispatcher = await connection.play(require("path").join(__dirname, './Sounds/' + fileName), { volume : 0.8 });

        dispatcher.on('start', () => {
            console.log(fileName + ' is now playing!');
        });

        dispatcher.on('finish', () => {
            console.log(fileName + ' has finished playing!');
            channel.leave();
        });
        
        dispatcher.on('error', console.error);
    } else if (newChannelID == null && user != 'Music Theme Bot') {
        console.log(user + " has left voice channel with id " + oldChannelID);
    } else {
        console.log(user + " muted or switched channels")
    }  
});

client.login(process.env.BOT_TOKEN);