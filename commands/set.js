const ytdl = require("discord-ytdl-core");
const embedTmp = require('../embed-temp.js');
const pool = require('../db.js');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Set a new music theme from a youtube link')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Youtube link for theme')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('start_time')
                .setDescription('Timestamp of link start (e.g., 0:00)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('end_time')
                .setDescription('Timestamp of link end (e.g., 0:10)')
                .setRequired(true)),
    async execute(interaction) {
        const link = interaction.options.getString('link');
        const start = convertTime(interaction.options.getString('start_time'));
        const end = convertTime(interaction.options.getString('end_time'));
        const duration = end - start;
        const sender = interaction.user.id;
        const username = interaction.user;

        const embedErr = {...embedTmp};
        embedErr.thumbnail = ""
        embedErr.title = ""

        if (start === null || end === null) {
            embedErr
                .description = "> Looks like you messed up the timestamps. Try something like '0:15' for the start/end time";
            return interaction.reply({ embeds: [embedErr], ephemeral: true  });
        } else if (duration > 10) {
            embedErr
                .description = "> Theme clips can't be longer than 10 seconds";
            return interaction.reply({ embeds: [embedErr], ephemeral: true  });
        }

        let info;
        try {
            info = await ytdl.getBasicInfo(link);

            let user = {
                ID: sender,
                Link: link,
                Start: start,
                Duration: duration,
                Enabled: 'T'
            };
            try {
                pool.query(
                    'insert into users set ? on duplicate key update ?',
                    [user, user]
                );
                const embed = {...embedTmp};
                embed.title = 'Groovy! :dancer:'
                embed.description = `${username} set a new theme!`;
                return interaction.reply({ embeds: [embed]
                    // , components: [{
                    //     type: 1,
                    //     components: [{
                    //         "style": 3,
                    //         "label": `Theme yoink!`,
                    //         "custom_id": `row_0_button_0`,
                    //         "disabled": false,
                    //         "type": 2
                    //     }]
                    // }]
                })
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: "Looks like you messed that up. Try something like: \n> /set www.youtube.com/link 0:10 0:15", ephemeral: true});
            };
        } catch (err) {
            if (!info) {
                embedErr
                    .description = "> Uh oh! This link doesn't look valid 😢";
                return interaction.reply({ embeds: [embedErr], ephemeral: true  });
            }
            console.error(err);
        }
    }
}

let convertTime = function(time) {
    let splitTime = time.split(":");
    let minute = splitTime[0];
    let seconds = splitTime[1];
    let result = parseFloat(seconds) + (minute * 60);
    if (typeof seconds === "undefined") return null; // no ':' provided
    return result;
};
