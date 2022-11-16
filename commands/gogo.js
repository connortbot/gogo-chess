const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { ActionRowBuilder, SelectMenuBuilder, Embed } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear } = require('../balance.json');
const { data } = require('./register');
const calculator = require('../calculator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gogo')
        .setDescription('Look the one of your GoGo builds.')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('Name of your GoGo')
                .setRequired(true),
                ),
    async execute(interaction) {
        const user = await database.getUser(interaction.user.id.toString());
        var gogos = user.inventory.split('-');
        var found = false
        var gogo = null
        for (let i=0; i<gogos.length; i++) {
            if (gogos[i].startsWith(interaction.options.getString('name'))) {
                gogo = await database.getGoGo(gogos[i]);
                break
            }
        }
        if (gogo != null) {
            const embed = await createEmbed(gogo,interaction);
            await interaction.reply({embeds: [embed]});
        } else {
            await interaction.reply("You don't have that GoGo!");
        }
    }
}

async function createEmbed(gogo,interaction) {
    const bGoGo = NormalGoGos[gogo.id.split('#')[0]];
    const statMultiplier = gogo.lvl*0.1+1.0;
    const gears = [gogo.gear1,gogo.gear2,gogo.gear3];

    var gogoATK = bGoGo["ATK"]*statMultiplier;
    var gogoATKBoost = 0;
    var gogoHP = bGoGo["HP"]*statMultiplier;
    var gogoHPBoost = 0;
    var gogoCRBoost = 0;
    var gogoCDBoost = 0;
    for (let i=0; i<3; i++) {
        if (gears[i] != '') {
            const gear = await database.getGear(gears[i]);
            if (gear.ATK >= 1) {
                gogoATKBoost += gear.ATK;
            } else {
                gogoATKBoost += gear.ATK*gogoATK;
            }
            if (gear.HP >= 1) {
                gogoHPBoost += gear.HP;
            } else {
                gogoHPBoost += gear.HP*gogoHP;
            }
            gogoCRBoost += gear.CRITRATE;
            gogoCDBoost += gear.CRITDMG;
        }
    }
    if (gogo.weapon != '') {
        const weapon = await database.getWeapon(gogo.weapon);
        var boosts = calculator.calcWeaponStats(gogo.weapon.split('#')[0].split('/')[1],weapon.lvl);
        gogoATKBoost += boosts[0];
        gogoCRBoost += boosts[1];
        gogoCDBoost += boosts[2];
    }
    gogoATKBoost = parseFloat(gogoATKBoost.toFixed(2).toString());
    gogoATK = parseFloat(gogoATK.toFixed(2).toString());
    gogoHPBoost = parseFloat(gogoHPBoost.toFixed(2).toString());
    gogoHP = parseFloat(gogoHP.toFixed(2).toString());
    gogoCRBoost = parseFloat(gogoCRBoost.toFixed(3).toString());
    gogoCDBoost = parseFloat(gogoCDBoost.toFixed(3).toString());
    var weaponKey
    if (gogo.weapon != '') {
        weaponKey = gogo.weapon.split('#')[0].split('/')[1]
    } else {
        weaponKey = ''
    }
    const embed = new EmbedBuilder()
        .setColor(0x46FF00)
        .setTitle(gogo.id.split('#')[0]+" (lvl "+gogo.lvl.toString()+")")
        .setDescription("*"+bGoGo["description"]+"*")
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields({ name: ":crossed_swords: **BASE ATK** :crossed_swords:",value: gogoATK.toString()+" (+"+(gogoATKBoost*1).toString()+") *"+bGoGo["type"]+"*", inline: true },
                { name: ":heart: **BASE HP** :heart:", value: gogoHP.toString()+" (+"+(gogoHPBoost*1).toString()+")", inline: true  },
                { name: ":drop_of_blood: **CRIT DMG** :drop_of_blood:",value: (bGoGo["CRITDMG"]*100).toString()+"%"+" (+"+(gogoCDBoost*100).toString()+"%"+")",inline:true },
                { name: ":drop_of_blood: **CRIT RATE** :drop_of_blood:",value: (bGoGo["CRITRATE"]*100).toString()+"%"+" (+"+(gogoCRBoost*100).toString()+"%"+")",inline:true})
        .addFields({ name: ":dagger: **Weapon** :dagger:", value: Weapons[weaponKey]["name"] })
        .setImage("https://static.wikia.nocookie.net/crazybonespedia/images/0/0f/Smilingcrazybone.jpg/revision/latest?cb=20150217121608")//PLACEHOLDER IMAGE OF SUMON
        .addFields({ name: '**Slot 1**', value: '*'+Gear[gogo.gear1.split('#')[0]]["name"]+'*',inline:true },
        { name: '**Slot 2**', value: '*'+Gear[gogo.gear2.split('#')[0]]["name"]+'*',inline:true },
        { name: '**Slot 3**', value: '*'+Gear[gogo.gear3.split('#')[0]]["name"]+'*',inline:true })
    return embed;
}