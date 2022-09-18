const embedTmp = require('../embed-temp.js');
const pool = require('../db.js');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disable')
        .setDescription('Disable your introductory theme music'),
    async execute(interaction) {
        let id = interaction.user.id;

        try {
            pool.query(
                'update users set enabled=? where id=?',
                ['F', id]
            );
            const embed = {...embedTmp};
            embed.title = "Awh. 😢"
            embed.description = "> Disabled Music Theme Bot";
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (err) {
            console.error(err);
            return interaction.reply('err');
        };
    }
}
