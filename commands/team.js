const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { Collection, Events, ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons } = require('../balance.json');
const battles = require('../battles');


async function findGoGo(stringID,gogoName) {
    const user = await database.getUser(stringID);
    for (let i=0; i<user.inventory.split('-').length; i++) {
        if (user.inventory.split('-')[i].startsWith(gogoName)) {
            return user.inventory.split('-')[i];
        }
    }
    return "NGoGo"
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('team')
		.setDescription('Builds your team.')
        .addStringOption((option) =>
            option
                .setName('ftone')
                .setDescription('Frontline Tank 1')
                .setRequired(true),
                )
        .addStringOption((option) =>
                option
                    .setName('fttwo')
                    .setDescription('Frontline Tank 2')
                    )
        .addStringOption((option) =>
                option
                    .setName('bsp')
                    .setDescription('Backline Support')
                    )
        .addStringOption((option) =>
                option
                    .setName('bc')
                    .setDescription('Backline Damage Carry')
                    ),
	async execute(interaction) {
        const ft1 = interaction.options.getString('ftone');
        const ft2 = interaction.options.getString('fttwo');
        const bsp = interaction.options.getString('bsp');
        const bc = interaction.options.getString('bc');
        const lst = [ft1,ft2,bsp,bc];
        var team = ""
        for (let i=0; i<lst.length; i++) {
            if (lst[i] == null) {
                continue
            } else {
                const gogoID = await findGoGo(interaction.user.id.toString(),lst[i]);
                console.log(gogoID);
                if (gogoID == "NGoGo") {
                    interaction.reply('You do not have '+lst[i]+'. Please form your team with GoGos you possess.');
                } else {
                    if (team == "") {
                        team = team+gogoID;
                    } else {
                        team = team+"-"+gogoID
                    }
                }
            }
        }
		await database.updateTeam(interaction.user.id.toString(),team);
        await interaction.reply('Your team has been formed.');
	},	
};