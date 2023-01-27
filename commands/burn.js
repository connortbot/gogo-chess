const { SlashCommandBuilder, parseResponse } = require('discord.js');
const database = require('../database');
const { Collection, Events, ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons, SellValues } = require('../balance.json');
const battles = require('../battles');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('burn')
        .setDescription('Burn a gear.')
        .addStringOption((option) =>
            option
                .setName('range')
                .setDescription("Describe which gears or weapons to burn. Indicate ranges with '-' and separate with ','")
                .setRequired(true))
        .addStringOption((option) =>
            option
                .setName('scope')
                .setDescription("Enter Gear/Weapon to specify what to burn.")
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const mode = interaction.options.getString('scope');
        if (mode != "Gear" && mode != "Weapon") {
            interaction.editReply("Please enter 'Gear' or 'Weapon' in the scope field.");
            return;
        }
        // Get range of indexes
        const range = interaction.options.getString('range').split(',');
        const usr = await database.getUser(interaction.user.id.toString());
        var r = [];
        for (let i=0; i<range.length; i++) {
            if (range[i].includes('-')) {
                if (parseInt(range[i].split('-')[1])>parseInt(range[i].split('-')[0])) {
                    for (let a=parseInt(range[i].split('-')[0]); a<(1+parseInt(range[i].split('-')[1])); a++) {
                        r.push(a);
                    }
                }
            } else {
                r.push(range[i]);
            }
        }
        r = [...new Set(r)]; // removes duplicates by converting to a Set, implicit removal
        
        const all = usr.gear.split('-');
        if (mode == "Gear") {
            master = all.filter(entry => !entry.startsWith("Weapon"));
        } else {
            master = all.filter(entry => entry.startsWith("Weapon"));
        }

        // Get BonesAMT
        var bonesAmt = 0;
        for (let i=0; i<r.length; i++) {
            if (r[i] > master.length) {
                interaction.editReply("You placed an invalid range! Try using */inventory* to double-check your numbers.");
                return;
            }
            if (mode == "Weapon") {
                const stats = Weapons[master[r[i]-1].split("#")[0].split("/")[1]];
                bonesAmt += SellValues["Weapons"][stats["rarity"].toString()];
            } else {
                const stats = Gear[master[r[i]-1].split("#")[0]];
                bonesAmt += SellValues["Gear"][stats["rarity"].toString()];
            }
        }
        await interaction.channel.send('<@'+interaction.user.id.toString()+">, are you sure you want to burn these items for "+bonesAmt.toString()+" bones? [Y/N]");
        var embed = new EmbedBuilder()
            .setColor(0x8B8B8B)
            .setTitle("Selected "+mode+":")
        for (i=0; i<r.length; i++) {
            var stats;
            var item;
            if (mode == "Gear") {
                baseStats = Gear[master[r[i]-1].split("#")[0]];
                item = await database.getGear(master[r[i]-1]);
                embed.addFields(
                    { name: "`"+(r[i]).toString()+".` "+baseStats["name"], value: 'LVL: '+item.lvl.toString()+" HP: "+item.HP.toString()+" ATK: "+item.ATK.toString()+" CRIT RATE: "+(item.CRITRATE*100).toFixed(2).toString()+"% CRIT DMG: "+(item.CRITDMG*100).toFixed(2).toString()+"%"});
            } else {
                baseStats = Weapons[master[r[i]-1].split("#")[0].split("/")[1]];
                item = await database.getWeapon(master[r[i]-1]);
                embed.addFields(
                    { name: "`"+(r[i]).toString()+".` "+baseStats["name"], value: "*"+Weapons[master[r[i]-1].split("#")[0].split("/")[1]]["rarity"].toString()+"-star Weapon*"}
                )
            }
        }
        const filter = response => (response.author.id.toString() === interaction.user.id.toString());
        await interaction.channel.send({embeds: [embed]});
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
            .then(async collected => {
                if (collected.first().content == 'Y') {
                    await database.giveBones(interaction.user.id.toString(),bonesAmt);
                    for (let i=0; i<master.length; i++) {
                        if (mode == "Gear") {await database.burnGear(interaction.user.id.toString(),master[i]);}
                        else {await database.burnWeapon(interaction.user.id.toString(),master[i]);}
                    }
                    // message "you got bones!" embed here
                    await interaction.editReply("Burned...");
                    return;
                }
            })
    }
}