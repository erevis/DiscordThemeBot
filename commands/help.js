const embedTmp = require('../embed-temp.js');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show useable commands for the Music Theme Bot'),
    async execute(interaction) {
        const embed = {...embedTmp};
        embed.title = 'Music Theme Bot Commands'
        embed.description = '**Set a new theme**\n> /set\n\n**Enable your theme music**\n> /enable\n\n**Disable your theme music**\n> /disable'
        interaction.reply({ embeds: [embed], ephemeral: true })
    }
}
