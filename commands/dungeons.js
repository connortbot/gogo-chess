const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons } = require('../balance.json');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('dungeons')
        .setDescription('Lists out the dungeons.'),
    async execute(interaction) {
        var embed = new EmbedBuilder()
            .setColor(0x8B8B8B)
            .setTitle("Available Dungeons to Conquer...")
        for (i=0; i<Object.keys(Dungeons).length; i++) {
            const indexKey = Object.keys(Dungeons)[i];
            const description = "*Lvl: "+Dungeons[indexKey]["recommended_lvl"]+", Reward: "+Gear[Dungeons[indexKey]["loot"]]["name"]+", Waves: "+Object.keys(Dungeons[indexKey]["waves"]).length.toString()+"*";
            embed.addFields(
				{ name: "`"+(i+1).toString()+".` "+Object.keys(Dungeons)[i], value: description});
        }
        await interaction.reply({embeds: [embed]});
    }
}