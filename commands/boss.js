const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { Collection, Events, ActionRowBuilder, StringSelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons } = require('../balance.json');
const battles = require('../battles');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('boss')
        .setDescription("Challenge K'aeda, the Dragon of Crystals."),
    async execute(interaction) {
        const user = await database.getUser(interaction.user.id.toString());
        const limits = user.fight_limits.split('-');
        if (limits[0] === '1') {
            await interaction.reply("You have already defeated the boss!");
            return;
        }
        if (limits[2] == '1') {
            await interaction.reply("You are currently fighting elsewhere. Wait for that battle to finish first, and come back.");
            return;
        }
        await interaction.deferReply();
        if (user == null) {
            await interaction.editReply("You can't fight without joining GoGo World! Use **/register** to join today!")
            return
        }
        if (user.team.split('-').length == 0) {
            await interaction.editReply('Please form your team first.');
            return
        }
        for (let i=0; i<1; i++) {
            var b = await battles.start_battle(user.team.split('-'),["Monster/Dragon K'aeda"],interaction.channel,[user]);
            console.log(b);
            if (b != "side1") {
                // Failed the Fight
                await interaction.editReply('You failed the fight.');
                return
            }
            if (b == "noTeam") {
                await interaction.editReply('You did not select a team. (Use **/team** to set one up)')
                return
            }
        }
        // Defeated the Boss
        await interaction.channel.send('There is no loot currently available for this boss.');
        user.fight_limits = `1-${limits[1]}-${limits[2]}-${limits[3]}-${limits[4]}`;
        await user.save();
        await interaction.editReply(interaction.user.username+' defeated the boss!');
    }
}