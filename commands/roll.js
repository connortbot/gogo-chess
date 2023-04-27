const { SlashCommandBuilder, parseResponse } = require('discord.js');
const database = require('../database');
const { Collection, Events, ActionRowBuilder, StringSelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons, SellValues } = require('../balance.json');
const battles = require('../battles');

/**
 * Rolls a specified amount of rolls on standard banner.
 * @param {*} interaction - Interaction object
 * @change - Better, more optimized messages to send.
 * @complexity - O(n^2)
 */
async function execute(interaction) {
    await interaction.deferReply();
    const rolls = interaction.options.getInteger('rolls');
    const usr = await database.getUser(interaction.user.id.toString());
    for (let i=0; i<rolls; i++) {
        var r = Math.random() * (Object.keys(NormalGoGos).length - 1);
        r = Math.round(r);
        const possibleGoGo = Object.keys(NormalGoGos)[r];
        if (Math.random() <= 0.1) {
            const inv = usr.inventory.split("-");
            let valid = true;
            for (let j=0; j<inv.length; j++) {
                if (possibleGoGo == inv[j].split('#')[0]) {
                    await interaction.channel.send(":sob: (roll "+(i+1).toString()+"/"+rolls.toString()+")");
                    valid = false;
                    break;
                }
            }
            if (valid) {
                const addedID = await database.createNewGoGo(possibleGoGo);
                await usr.update({inventory: inv+"-"+addedID});
                await interaction.channel.send(":star: You rolled a "+possibleGoGo+"! :star: (roll "+(i+1).toString()+"/"+rolls.toString()+")");
            }
        } else {
            await interaction.channel.send(":broken_heart: (roll "+(i+1).toString()+"/"+rolls.toString()+")");
        }
    }
    await interaction.editReply("Best of luck!");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll to gain a new GoGo!')
        .addIntegerOption((option) =>
            option
                .setName('rolls')
                .setDescription("The number of rolls you wish to use.")
                .setRequired(true)),
    execute
}