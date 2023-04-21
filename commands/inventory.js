const { SlashCommandBuilder, ButtonStyle } = require('discord.js');
const database = require('../database');
const { ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder, ButtonBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear } = require('../balance.json');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription('Lists all your GoGos, gear or weapons.'),
	async execute(interaction) {
        var embed = new EmbedBuilder()
            .setColor(0xFF5634)
            .setTitle(interaction.user.username+", please choose which part of your inventory to read.")
        const user = database.getUser(interaction.user.id.toString());
        const gear = user.gear;
        const gogos = user.inventory;
        var buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('showGoGos-' + interaction.user.id.toString())
                    .setLabel('GoGos')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('showWeapons' + interaction.user.id.toString())
                    .setLabel('Weapons')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('showGear' + interaction.user.id.toString())
                    .setLabel('Gear')
                    .setStyle(ButtonStyle.Danger)
            )
        var pageButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prevPage')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('nextPage')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary),
            )
		await interaction.reply({embeds: [embed], components: [buttons]});
	},
}