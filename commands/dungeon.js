const { SlashCommandBuilder, UserFlags } = require('discord.js');
const database = require('../database');
const { Collection, Events, ActionRowBuilder, StringSelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons } = require('../balance.json');
const battles = require('../battles');

async function updateLimits(users) {
    const date = new Date();
    const curr_date = `${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}`;
    for (let i=0; i<users.length; i++) {
        let user = users[i];
        let limits = user.fight_limits.split('-');
        if (limits[3] !== curr_date) {
            user.fight_limits = `${limits[0]}-1-${limits[2]}-${curr_date}-${limits[4]}`;
        } else {
            user.fight_limits = `${limits[0]}-${limits[1]+1}-${limits[2]}-${curr_date}-${limits[4]}`;
        }
        await user.save();
    }
}



module.exports = {
    data: new SlashCommandBuilder()
        .setName('dungeon')
        .setDescription('Starts a dungeon.')
        .addIntegerOption((option) =>
            option
                .setName('number')
                .setDescription("The corresponding number of the dungeon. Try !dungeons if you don't know which one!")
                .setRequired(true)),
    async execute(interaction) {
        const date = new Date();
        const curr_date = `${date.getFullYear()}_${date.getMonth() + 1}_${date.getDate()}`
        const user = await database.getUser(interaction.user.id.toString());
        const limits = user.fight_limits.split('-');
        if (limits[1] === '10' && limits[3] === curr_date) {
            await interaction.reply("You have run out of dungeon runs for today. Please come back tomorrow!");
            return;
        }
        if (limits[2] === '1') {
            await interaction.reply("You are currently fighting elsewhere. Wait for that battle to finish first, and come back.");
            return;
        }
        await interaction.deferReply();
        const dungeonName = Object.keys(Dungeons)[interaction.options.getInteger('number')-1];
        if (user.team.split('-').length == 0) {
            await interaction.editReply('Please form your team first.');
        }
        for (let i=0; i<Dungeons[dungeonName]["waves"].length; i++) {
            var b = await battles.start_battle(user.team.split('-'),Dungeons[dungeonName]["waves"][i],interaction.channel,[user]);
            if (b != "side1") {
                // Failed the Fight
                await updateLimits([user]);
                await interaction.editReply('You failed the fight');
                return;
            }
            if (b == "noTeam") {
                await interaction.editReply('You did not select a team. (Use **/team** to set one up)')
                return
            }
        }
        // Defeated the Dungeon
        await updateLimits([user]);
        await interaction.channel.send('You were awarded the '+Gear[Dungeons[dungeonName]["loot"]]["name"]+' and '+Dungeons[dungeonName]["bones"].toString()+' bones upon clearing this dungeon.');
        const gearID = await database.createNewGear(Dungeons[dungeonName]["loot"]);
        await database.giveGearWeapon(interaction.user.id.toString(),gearID);
        await database.giveBones(interaction.user.id.toString(),Dungeons[dungeonName]["bones"]);
        await interaction.editReply(interaction.user.username+' cleared the '+dungeonName+'.');
    }
}