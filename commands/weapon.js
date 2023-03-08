const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const calculator = require("../calculator");
const { ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
        await interaction.deferReply();
        const user = await database.getUser(interaction.user.id.toString());
        const gogos = user.inventory.split('-');
        const gear = user.gear.split('-');
        var gogo = null;
        var weapon = [];
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
                            weapon.push(gear[i]);
                        }
                    }
                }
            }
        }
        if (gogo == null || weapon == []) {
            await interaction.editReply('You do not have that GoGo or Weapon.');
            return
        }
        console.log(weapon);
        var embed
        if (weapon.length == 1) {
            const lostWeaponGoGo = await database.WeaponizeGoGo(gogo,weapon[0].split('/')[1],interaction.user.id.toString());
            if (lostWeaponGoGo != 'firstWeaponize') {
                embed = new EmbedBuilder()
                    .setTitle(interaction.user.username+"'s "+lostWeaponGoGo.split("#")[0]+" unequipped the "+Weapons[weapon[0].split('#')[0].split('/')[1]]["name"]+".");
                await interaction.editReply({embeds: [embed]});
            }
            embed = new EmbedBuilder()
                .setTitle(interaction.user.username+"'s "+gogo.split("#")[0]+" equips the "+Weapons[weapon[0].split('#')[0].split('/')[1]]["name"]+"!");
            await interaction.editReply({embeds: [embed]});
        } else if (weapon.length == 0) {
            await interaction.editReply('You have none of that kind of gear. Please try again.')
        } else {
            embed = new EmbedBuilder()
                .setColor(0xFF5634)
                .setTitle(interaction.user.username+", choose which "+Weapons[weapon[0].split('#')[0].split('/')[1]]["name"]+" you wish to equip.")
            embed.setFooter({text: 'PAGE 1/'+parseInt(Math.ceil(weapon.length/5)).toString()})
            var pageButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prevPage-specificweapon+'+Weapons[weapon[0].split('#')[0].split('/')[1]]+'-0')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('nextpage-specificweapon+'+Weapons[weapon[0].split('#')[0].split('/')[1]]+'-0')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Secondary),
            )
            var l
            if (weapon.length < 5) {l = weapon.length;} 
            else {l = 5;}
            for (let i=0; i<l; i++) {
                var tWeapon = await database.getWeapon(weapon[i].split('/')[1]);
                const weaponBoosts = await calculator.calcWeaponStats(weapon[i].split('#')[0].split('/')[1],tWeapon.lvl);
                const descATK = ", ATK "+weaponBoosts[0].toString()
                const descCR = ", CRIT RATE "+(weaponBoosts[1]*100).toFixed(2).toString()+"%"
                const descCD = ", CRIT DMG "+(weaponBoosts[2]*100).toFixed(2).toString()+"%"
                const userGoGos = user.inventory.split('-');
                var owner = " [Owned by no one.]"
                for (let i=0; i<userGoGos.length; i++) {
                    var nGoGo = await database.getGoGo(userGoGos[i]);
                    if (nGoGo.weapon == weapon[i]) {
                        owner = " [Owned by "+userGoGos[i].split('#')[0]+"]"
                    }
                }
                const description = "*LVL "+tWeapon.lvl.toString()+descATK+descCR+descCD+owner+"*";
                //(weaponBoosts[0]+Weapons[lst[i].split('#')[0].split('/')[1]]["ATK"])
                embed.addFields(
                    { name: "`"+(i+1).toString()+".` "+"**"+Weapons[weapon[i].split('#')[0].split('/')[1]]["name"]+"**", value: description});
            }
            await interaction.channel.send('<@'+user.id.toString()+">, please type the number to indicate which weapon you wish to equip.");
            await interaction.channel.send({embeds: [embed], components: [pageButtons]});
            const filter = response => (response.author.id.toString() === user.id.toString());
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    var num = parseInt(collected.first().content);
                    if (isNaN(num)) { interaction.editReply() }
                    if (num > weapon.length || num < 1) {
                        interaction.editReply('This is an invalid #. Please try **/weapon** again.')
                    } else {
                        const lostWeaponGoGo = await database.WeaponizeGoGo(gogo,weapon[num-1].split('/')[1],interaction.user.id.toString());
                        if (lostWeaponGoGo != 'firstWeaponize') {
                            embed = new EmbedBuilder()
                                .setTitle(interaction.user.username+"'s "+lostWeaponGoGo.split("#")[0]+" unequipped the "+Weapons[weapon[0].split('#')[0].split('/')[1]]["name"]+".");
                            await interaction.editReply({embeds: [embed]});
                        }
                        embed = new EmbedBuilder()
                            .setTitle(interaction.user.username+"'s "+gogo.split("#")[0]+" equips the "+Weapons[weapon[0].split('#')[0].split('/')[1]]["name"]+"!");
                        await interaction.editReply({embeds: [embed]});
                    }
                    
                })
                .catch(collected => {
                    // No response.
                    interaction.editReply('<@'+coop.id.toString()+"> doesn't want to fight. Until next time!");
                })
        }
	},
};