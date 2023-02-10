const { SlashCommandBuilder, parseResponse } = require('discord.js');
const database = require('../database');
const { Collection, Events, ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons, SellValues } = require('../balance.json');
const battles = require('../battles');

const rcosts = {
    3: {
        2: 100,
        3: 200,
        4: 400,
        5: 1000
    },
    4: {
        2: 1000,
        3: 10000,
        4: 50000,
        5: 200000
    },
    5: {
        2: 5000,
        3: 100000,
        4: 500000,
        5: 10000000
    }
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Level up a gear or weapon.')
        .addStringOption((option) =>
            option
                .setName('index')
                .setDescription("Use /inventory to get where in your inventory the item is!")
                .setRequired(true))
        .addStringOption((option) =>
            option
                .setName('scope')
                .setDescription("Enter Gear/Weapon to specify where to look.")
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const mode = interaction.options.getString('scope');
        if (mode != "Gear" && mode != "Weapon") {
            interaction.editReply("Please enter 'Gear' or 'Weapon' in the scope field.");
            return;
        }
        const ix = await interaction.options.getString('index').split(',');
        const usr = await database.getUser(interaction.user.id.toString());
        const all = usr.gear.split('-');
        if (mode == "Gear") {
            master = all.filter(entry => !entry.startsWith("Weapon"));
        } else {
            master = all.filter(entry => entry.startsWith("Weapon"));
        }
        var i;
        var rarity;
        var cost;
        if (master.length == 0) {
            await interaction.editReply("You have no "+mode+"!");
            return;
        }
        if (mode == 'Gear') {
            i = await database.getGear(master[ix-1]);
            rarity = Gear[master[ix-1].split('#')[0].split('/')[1]]["rarity"];
        } else {
            console.log(master);
            i = await database.getWeapon(master[ix-1]);
            rarity = Weapons[master[ix-1].split('#')[0].split('/')[1]]["rarity"];
        }
        if (i.lvl == 5) {
            await interaction.editReply('That gear is already at the max level!')
            return;
        }
        // Get BonesAMT
        cost = rcosts[rarity][i.lvl+1];
        if (usr.bones < cost) {
            await interaction.editReply('You do not have enough bones to upgrade that gear.')
            return;
        }
        await interaction.channel.send('<@'+interaction.user.id.toString()+">, are you sure you want to level up that "+mode+" for "+cost.toString()+" bones? [Y/N]");
        var embed = new EmbedBuilder()
            .setColor(0x8B8B8B)
            .setTitle('Leveling Up!')
        const filter = response => (response.author.id.toString() === interaction.user.id.toString());
        await interaction.channel.send({embeds: [embed]});
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
            .then(async collected => {
                if (collected.first().content == 'Y') {
                    await database.giveBones(interaction.user.id.toString(),-cost);
                    if (mode == 'Gear') {
                        await database.levelGear(master[ix-1]);
                    } else {await database.levelWeapon(master[ix-1])};
                    // message embed here
                    await interaction.editReply("Leveled up!");
                    return;
                }
            })
    }
}