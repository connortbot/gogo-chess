
const { NormalGoGos, Weapons, Gear } = require('./balance.json');
const calculator = require('./calculator');
const battles = require('./battles');
const database = require('../database');
const { ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Responds to user selection of gear and equips a GoGo with a piece of gear
 * @param {interaction} interaction 
 */
async function equipGear_SELECTMENU(interaction) {
    const gogoID = interaction.customId.split('-')[3];
    const slot = interaction.customId.split('-')[2];
    const gear = interaction.values[0];
    const lostGearGoGo = await database.GearGoGo(gogoID,gear,interaction.user.id.toString(),parseInt(slot));
    if (lostGearGoGo != 'firstGearing') {
        if (gear.length==0) {
            embed = new EmbedBuilder()
                .setTitle(lostGearGoGo.split('#')[0]+" unequipped their "+Gear[gear.split('#')[0]]["name"]+"!");
            await interaction.channel.send({embeds: [embed]});
        }
    }
    embed = new EmbedBuilder()
        .setTitle(gogoID.split('#')[0]+" equipped the "+Gear[gear.split('#')[0]]["name"]+"!");
    await interaction.reply({embeds: [embed]});
}

async function pages_LISTMENU(interaction) {
    // all commands will have custom IDs (e.g the button ID for the /weapon command is nextPage-specificweapon-0)
    const type = interaction.customId.split('-')[2];
    const page = interaction.customId.split('-')[3];
    var lst
    // INVENTORY COMMAND // [compile gear/weapon lists]
    if (type == 'gogo') {
        lst = gogos.split('-');
    } else if (type == 'weapon') {
        lst = gear.split('-');
        for (let i=0; i<lst.length; i++) {
            if (!lst[i].startsWith('Weapon/')) {
                lst.splice(i,1);
                i -= 1
            }
        }
    } else if (type == 'gear') {
        lst = gear.split('-');
        for (let i=0; i<lst.length; i++) {
            if (lst[i].startsWith('Weapon/')) {
                lst.splice(i,1);
                i -= 1;
            }
        }
    }
    var weapon = [];
    // WEAPON COMMAND // [compile specific weapon list]
    if (type.startsWith('specificweapon')) {
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
    }

    // GENERAL LISTS //	
    if ((parseInt(page)-1) == 0 && interaction.customId.startsWith('prevPage')) {
        return
    }
    if (parseInt(page)+1 > parseInt(Math.ceil(lst.length/5)) && interaction.customId.startsWith('nextPage')) {
        return
    }
    var newpagenumber
    if (interaction.customId.startsWith('prevPage')) {
        newpagenumber = (parseInt(page)-1)
        embed.setFooter({text: 'PAGE '+newpagenumber.toString()+'/'+parseInt(Math.ceil(lst.length/5)).toString()})
    } else if (interaction.customId.startsWith('nextPage')) {
        newpagenumber = (parseInt(page)+1)
        embed.setFooter({text: 'PAGE '+newpagenumber.toString()+'/'+parseInt(Math.ceil(lst.length/5)).toString()})
    }
    var pageButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prevPage-'+interaction.customId.split('-')[1]+'-'+newpagenumber.toString())
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('nextPage-'+interaction.customId.split('-')[1]+'-'+newpagenumber.toString())
                .setLabel('Next')
                .setStyle(ButtonStyle.Secondary),
    )
    var l
    l = parseInt(newpagenumber)*5;
    for (let i=newpagenumber*5-5; i<Math.min(l,lst.length); i++) {
        if (type=='gogo') {
            var tGoGo = await database.getGoGo(lst[i]);
            const description = "LVL "+tGoGo.lvl.toString()
            embed.addFields(
                { name: "`"+(i+1).toString()+".` "+"**"+lst[i].split('#')[0]+"**", value: description});
        } else if (type=='weapon') {
            var tWeapon = await database.getWeapon(lst[i]);
            const weaponBoosts = await calculator.calcWeaponStats(lst[i].split('#')[0].split('/')[1],tWeapon.lvl);
            const descATK = ", ATK "+weaponBoosts[0].toString()
            const descCR = ", CRIT RATE "+(weaponBoosts[1]*100).toString()+"%"
            const descCD = ", CRIT DMG "+(weaponBoosts[2]*100).toString()+"%"
            const description = "*LVL "+tWeapon.lvl.toString()+descATK+descCR+descCD+"*";
            (weaponBoosts[0]+Weapons[lst[i].split('#')[0].split('/')[1]]["ATK"])
            embed.addFields(
                { name: "`"+(i+1).toString()+".` "+"**"+Weapons[lst[i].split('#')[0].split('/')[1]]["name"]+"**", value: description});
        } else if (type=='gear') {
            var g = await database.getGear(lst[i]);
            var description = "*LVL "+g.lvl.toString();
            if (g.ATK >= 1) {
                description += ", ATK "+g.ATK.toString();
            } else {
                description += ", ATK% +"+(g.ATK*100).toString()+"%";
            }
            if (g.HP >= 1) {
                description += ", HP "+g.HP.toString();
            } else {
                description += ", HP% +"+(g.HP*100).toString()+"%";
            }
            description += ", CRIT RATE "+(g.CRITRATE*100).toString()+"%";
            description += ", CRIT DMG "+(g.CRITDMG*100).toString()+"%";
            embed.addFields(
                { name: "`"+(i+1).toString()+".` "+"**"+Gear[lst[i].split('#')[0]]["name"]+"**", value: description+"*"});
        } else if (type.startsWith('specificweapon')) {
            var tWeapon = await database.getWeapon(weapon[i]);
            const weaponBoosts = await calculator.calcWeaponStats(weapon[i].split('#')[0].split('/')[1],tWeapon.lvl);
            const descATK = ", ATK "+weaponBoosts[0].toString()
            const descCR = ", CRIT RATE "+(weaponBoosts[1]*100).toString()+"%"
            const descCD = ", CRIT DMG "+(weaponBoosts[2]*100).toString()+"%"
            const userGoGos = user.inventory.split('-');
            var owner = " [Owned by no one.]"
            for (let i=0; i<userGoGos.length; i++) {
                var nGoGo = await database.getGoGo(userGoGos[i]);
                if (nGoGo.weapon == weapon[i]) {
                    owner = " [Owned by "+userGoGos[i].split('#')[0]+"]"
                }
            }
            const description = "*LVL "+tWeapon.lvl.toString()+descATK+descCR+descCD+owner+"*";
            embed.addFields(
                { name: "`"+(i+1).toString()+".` "+"**"+Weapons[lst[i].split('#')[0].split('/')[1]]["name"]+"**", value: description});
        }
    }
    await interaction.editReply({embeds: [embed],components: [pageButtons]});
}




module.exports = {
    equipGear_SELECTMENU,

    pages_LISTMENU
}