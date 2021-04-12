require('dotenv').config();
const Discord = require('discord.js');
const { link } = require('ffmpeg-static');
const client = new Discord.Client();  

// DATABASE CONNECTION

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// BOT CONNECTION

let timeout;

client.on('ready', () => {
    console.log("Discord API Initialized");
});

client.on('message', msg => {
    const prefix = '!';
    if (!msg.content.startsWith(prefix)) return;

    if (msg.content == (prefix + 'tset')) {
        msg.reply("Get command help with !tset help");
        return;
    }

    if (msg.content.startsWith(prefix + "tset help")) {
        msg.reply("Try \"!tset 'youtube link' startTime endTime\". The start and end time should look like 0:00");
        return;
    }

    if (msg.content.startsWith(prefix + "tset enable")) {
        msg.reply("Theme bot enabled 😄");
        let id = msg.author.id;
        try {
            pool.query(
                'update users set enabled=? where id=?',
                ['T', id],
                function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.error(result);
            });
            return;
        } catch (err) {
            console.error(err);
        };
    }

    if (msg.content.startsWith(prefix + "tset disable")) {
        msg.reply("Theme bot disabled 😢");
        let id = msg.author.id;
        try {
            pool.query(
                'update users set enabled=? where id=?',
                ['F', id],
                function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.error(result);
            });
            return;
        } catch (err) {
            console.error(err);
        };
    }

    if (msg.content.startsWith(prefix + 'tset ')) {
        try {
            let command = msg.content.slice(prefix.length + 'tset'.length).trim();
            console.log(command);
    
            const sender = msg.author.id;
            const link = command.split(' ')[0];
            const start = command.split(' ')[1];
            const end = command.split(' ')[2];
    
            const startSec = convertTime(start);
            const endSec = convertTime(end);
            const duration = endSec - startSec;

            if (duration > 10) {
                msg.reply("Theme clips can't be longer than 10 seconds");
                return;
            }
    
            let user = {
                ID: sender,
                Link: link,
                Start: startSec,
                Duration: duration,
                Enabled: 'T'
            };
    
            pool.query(
                'insert into users set ? on duplicate key update ?',
                [user, user],
                function(err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.error(result);
            });
            msg.reply("New theme set as " + link.substr(link.indexOf('//') + 2, link.length));
        } catch(err) {
            msg.reply("Looks like you messed that up. Try something like: !tset www.youtube.com/link 0:10 0:15")
        }
    }
})

client.on('voiceStateUpdate', async (oldState, newState) => {
    const newChannelID = newState.channelID;
    const oldChannelID = oldState.channelID;
    const member = newState.member;
    let user = member.user.username;
    let id = member.user.id;
    let channel = member.voice.channel;

    if (oldChannelID == null && newChannelID != null && user != 'Music Theme Bot') {
        console.log(user + " has joined voice channel with id " + newChannelID);

        const ytdl = require("discord-ytdl-core");

        try {
            const result = await getLink(id);
            const link = result[0][0].Link;
            const start = result[0][0].Start;
            const duration = result[0][0].Duration;
            const enabled = result[0][0].Enabled;

            if (enabled == 'T') {
                const connection = await channel.join();
                connection.voice.setSelfDeaf(true);

                const stream = ytdl(link, {
                    filter: "audioonly",
                    seek: start,
                    opusEncoded: true
                });

                //const dispatcher = connection.play(require("path").join(__dirname, './Sounds/' + fileName), { volume : 0.8 })
                const dispatcher = connection.play(stream, {type: 'opus', volume : 0.8})

                dispatcher.on('start', () => { // song start
                    console.log(user + ' is now playing a theme!');
                    clearTimeout(timeout);

                    timeout = setTimeout(() => {
                        channel.leave();
                    }, duration * 1000)
                });

                dispatcher.on('error', console.error); // song error
            }
        } catch(err) {
            // console.error(err);
        }
    } else if (newChannelID == null && user != 'Music Theme Bot') {
        console.log(user + " has left voice channel with id " + oldChannelID);
    } else {
        console.log(user + " muted or switched channels");
    };
});

client.login(process.env.BOT_TOKEN);

let convertTime = function(time) {
    let splitTime = time.split(":");
    let minute = splitTime[0];
    let seconds = splitTime[1];
    let result = parseInt(seconds) + (minute * 60);
    return result;
};

async function getLink(id) {
    const dbconnection = await pool.getConnection();
    await dbconnection.beginTransaction();
    try {
        const link = await dbconnection.execute('select * from users where id = ?',
        [id]);
        await dbconnection.commit();
        return link;
    } catch (err) {
        console.error(err);
    } finally {
        dbconnection.release();
    }
}