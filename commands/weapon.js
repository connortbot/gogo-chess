const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear } = require('../balance.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('weapon')
		.setDescription('Makes one of your GoGos use a weapon.')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('Name of your GoGo')
                .setRequired(true),
                )
        .addStringOption((option) =>
            option
                .setName('weapon')
                .setDescription('Name of your Weapon')
                .setRequired(true),
                ),
	async execute(interaction) {
        const user = await database.getUser(interaction.user.id.toString());
        const gogos = user.inventory.split('-');
        const gear = user.gear.split('-');
        var gogo = null
        var weapon = null
        for (let i=0; i<gogos.length; i++) {
            if (gogos[i].startsWith(interaction.options.getString('name'))) {
                gogo = gogos[i];
                break;
            }
        }
        for (let i=0; i<gear.length; i++) {
            if (gear[i].startsWith("Weapon/")) {
                for (let k in Weapons) {
                    if (interaction.options.getString('weapon')==Weapons[k]["name"]) {
                        if (gear[i].startsWith("Weapon/"+k)) {
                            weapon = gear[i];
                            break;
                        }
                    }
                }
            }
        }
        if (gogo == null || weapon == null) {
            await interaction.reply('You do not have that GoGo or Weapon.');
        }
        
        var embed
		const lostWeaponGoGo = await database.WeaponizeGoGo(gogo,weapon,interaction.user.id.toString());
		if (lostWeaponGoGo != 'firstWeaponize') {
			embed = new EmbedBuilder()
				.setTitle(interaction.user.username+"'s "+lostWeaponGoGo.split("#")[0]+" unequipped the "+Weapons[weapon.split('#')[0].split('/')[1]]["name"]+".");
			await interaction.reply({embeds: [embed]});
		}
		embed = new EmbedBuilder()
			.setTitle(interaction.user.username+"'s "+gogo.split("#")[0]+" equips the "+Weapons[weapon.split('#')[0].split('/')[1]]["name"]+"!");
		await interaction.reply({embeds: [embed]});
	},
};