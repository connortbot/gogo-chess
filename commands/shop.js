const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');

const shop = [
    {name: "`1.` 1 roll", value: ":bone: **1000 bones** :bone:"},
    {name: "`2.  5 rolls", value: ":bone: **5000 bones** :bone:"},
    {name: "`3.  10 rolls", value: ":bone: **100,000 bones** :bone:"},
    {name: "`4.  100 rolls", value: ":bone: **1,000,000 bones** :bone:"} 
]

const shop_vals = [
    {
        "pay": "bones",
        "cost": 1000,
        "receive": "rolls",
        "amount": 1
    },
    {
        "pay": "bones",
        "cost": 5000,
        "receive": "rolls",
        "amount": 5
    },
    {
        "pay": "bones",
        "cost": 100000,
        "receive": "rolls",
        "amount": 10
    },
    {
        "pay": "bones",
        "cost": 1000000,
        "receive": "rolls",
        "amount": 100
    },
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Buy rolls and bones!')
        .addIntegerOption((option) =>
            option
                .setName('item')
                .setDescription('The # of the item you want to buy.')
                .setRequired(false),
                ),
    async execute(interaction) {
        const item_num = interaction.options.getInteger('item');
        if (item_num) {
            if (item_num <= 0 || item_num > shop_vals.length) {
                await interaction.reply("Please purchase an existing item! Use `/shop` to see the full list.");
            }
            const product = shop_vals[item_num-1];
            let usr = await database.getUser(interaction.user.id.toString());
            let usrID = interaction.user.id.toString();
            if (product["pay"] == "bones") {
                if (usr.bones < product["cost"]) {
                    await interaction.reply("You do not have enough bones to buy this!");
                } else {
                    await database.giveBones(usrID,-product["cost"]);
                }
            } else if (product["pay"] == "money") {
                return;
            }
            if (product["receive"] == "rolls") {
                let new_amt = usr.rolls + product["amount"];
                await database.giveRolls(usrID,product["amount"]);
                await interaction.reply("You have successfully purchased **"+new_amt.toString()+" rolls**!")
            }
        } else {
            var embed = new EmbedBuilder()
                .setColor(0x8B8B8B)
                .setTitle("Master GoGo's Shop")
            for (let i=0; i<shop.length; i++) {
                let j = shop[i];
                embed.addFields(j);
            }
            await interaction.reply({embeds: [embed]});
        }
    }
}