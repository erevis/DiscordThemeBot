const embedTmp = require('../embed-temp.js');
const pool = require('../db.js');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enable')
        .setDescription('Enable your introductory theme music'),
    async execute(interaction) {
        let id = interaction.user.id;

        try {
            pool.query(
                'update users set enabled=? where id=?',
                ['T', id]
            );
            const embed = {...embedTmp};
            embed.title = "Woohoo! 😄"
            embed.description = "> Enabled Music Theme Bot";
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (err) {
            console.error(err);
            return interaction.reply('err');
        };
    }
}
