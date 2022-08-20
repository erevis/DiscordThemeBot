require('dotenv').config();
const Discord = require('discord.js');
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
const embedTmp = new Discord.MessageEmbed()
    .setColor('#ff0000');

client.on('ready', () => {
    console.log("Discord API Initialized");
});

client.on('message', msg => {
    const prefix = '!';
    if (!msg.content.startsWith(prefix + 't ')) return;

    if (msg.content.startsWith(prefix + "t help")) {
        const embed = embedTmp
            .setDescription("\n> \"!t set 'youtube link' 0:10 0:15\" (startTime and endTime)\n> \"!t enable/disable\"\n")
        msg.reply(embed);
        return;
    }

    if (msg.content.startsWith(prefix + "t enable")) {
        const embed = embedTmp
            .setDescription("> Theme bot enabled 😄");
        msg.reply(embed);
        let id = msg.author.id;
        try {
            pool.query(
                'update users set enabled=? where id=?',
                ['T', id]
            );
            return;
        } catch (err) {
            console.error(err);
            return;
        };
    }

    if (msg.content.startsWith(prefix + "t disable")) {
        const embed = embedTmp
            .setDescription("> Theme bot disabled 😢");
        msg.reply(embed);
        let id = msg.author.id;
        try {
            pool.query(
                'update users set enabled=? where id=?',
                ['F', id]
            );
            return;
        } catch (err) {
            console.error(err);
            return;
        };
    }

    if (msg.content.startsWith(prefix + 't set ')) {
        try {
            let command = msg.content.slice(prefix.length + 't set'.length).trim();
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
                }
            );
            msg.reply("New theme set as " + link.substr(link.indexOf('//') + 2, link.length));
            return;
        } catch(err) {
            msg.reply("Looks like you messed that up. Try something like: \n> !t set www.youtube.com/link 0:10 0:15")
            return;
        }
    }

    // Unknown command
    msg.reply("Get command help with !t help");
    return;
})

client.on('voiceStateUpdate', async (oldState, newState) => {
    const newChannelID = newState.channelID;
    const oldChannelID = oldState.channelID;
    const member = newState.member;
    let user = member.user;
    let username = user.username;
    let channel = member.voice.channel;

    if (oldChannelID == null && newChannelID != null && username != 'Music Theme Bot') {
        console.log(username + " has joined voice channel with id " + newChannelID);

        const ytdl = require("discord-ytdl-core");

        try {
            const result = await getLink(user.id);
            const link = result[0][0].Link;
            const start = result[0][0].Start;
            const duration = result[0][0].Duration;
            const enabled = result[0][0].Enabled;
            const alerted = result[0][0].Alerted

            if (enabled == 'T') {
                const connection = await channel.join();
                connection.voice.setSelfDeaf(true);

                console.log("Music Theme Bot has joined " + channel)

                const stream = ytdl(link, {
                    filter: "audioonly",
                    seek: start,
                    opusEncoded: true
                });

                const dispatcher = connection.play(stream, {type: 'opus', volume : 0.8})

                dispatcher.on('start', () => { // song start
                    console.log(username + ' is now playing a theme!');
                    clearTimeout(timeout);

                    pool.query(
                        'update users set alerted=? where id=?',
                        ['F', user.id],
                        function(err, result) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                        console.error(result);
                    });

                    timeout = setTimeout(() => {
                        channel.leave();
                    }, duration * 1000)
                });

                dispatcher.on('error', e => { // song error
                    console.error("Song link not found: ");
                    console.log(e);
                    if (alerted != 'T') {
                        const embed = embedTmp
                            .setDescription("> Uh oh! Your discord music bot link couldn't be found. 😢\n> The link may have been deleted.");
                        user.send(embed);

                        pool.query(
                            'update users set alerted=? where id=?',
                            ['T', user.id],
                            function(err, result) {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            console.error(result);
                        });
                    }
                    channel.leave();
                });
            }
        } catch(err) {
            console.error(err);
        }
    } else if (newChannelID == null && user != 'Music Theme Bot') {
        console.log(user + " has left voice channel with id " + oldChannelID);
    } else {
        // console.log(user + " muted or switched channels");
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

    console.log("Fetching youtube link...")

    try {
        const link = await dbconnection.execute('select * from users where id = ?',
        [id]);
        await dbconnection.commit();
        return link;
    } catch (err) {
        console.error(err);
    } finally {
        console.log("Link found")
        dbconnection.release();
    }
}
