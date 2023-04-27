const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { Collection, Events, ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons } = require('../balance.json');
const battles = require('../battles');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('boss')
        .setDescription("Challenge K'aeda, the Dragon of Crystals.")
        .addMentionableOption((option) =>
            option
                .setName('teammateone')
                .setDescription('Ping your teammate!')),
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
        const coop = interaction.options.getMentionable('teammateone');
        if (user == null) {
            await interaction.editReply("You can't fight without joining GoGo World! Use **/register** to join today!")
            return
        }
        if (user.team.split('-').length == 0) {
            await interaction.editReply('Please form your team first.');
            return
        }
        if (coop == null) {
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
        } else {
            const coopUser = await database.getUser(coop.user.id.toString());
            if ((coopUser.team.split('-').length == 0)) {
                await interaction.editReply('<@'+coop.id.toString()+">, please form your team.");
            }
            await interaction.channel.send('<@'+coop.id.toString()+">, would you like to join <@"+interaction.user.id.toString()+"> to conquer this dungeon? (type Y)");
            const filter = response => (response.author.id.toString() === coop.id.toString() && response.author.id.toString() != coop.id.toString());
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    if (collected.first().content == 'Y') {
                        var team = [];
                        var uTeam = user.team.split('-');
                        var cTeam = coopUser.team.split('-');
                        for (let i=1; i<(coopUser.team.split('-').length+user.team.split('-').length); i++) {
                            if (i % 2 == 0) { //even
                                if (cTeam.length == 0) {
                                    continue;
                                }
                                team.push(cTeam[0]);
                                cTeam.shift();
                            } else {
                                if (uTeam.length == 0) {
                                    continue;
                                }
                                team.push(uTeam[0]);
                                uTeam.shift();
                            }
                        }
                        for (let i=0; i<1; i++) {
                            var b = await battles.start_battle(team,["Monster/Dragon K'aeda"],interaction.channel,[user,coopUser]);
                            if (b != "side1") {
                                // Failed the Fight
                                interaction.editReply('You failed the fight.');
                            }
                        }
                        // Defeated the Dungeon
                        await interaction.channel.send('There is no loot currently available for this boss.');
                        user.fight_limits = `1-${limits[1]}-${limits[2]}-${limits[3]}-${limits[4]}`;
                        await user.save();
                        coopUser.fight_limits = `1-${limits[1]}-${limits[2]}-${limits[3]}-${limits[4]}`;
                        await coopUser.save();
                        await interaction.editReply(interaction.user.username+"slayed K'aeda with "+coop.username+".");
                    } else {
                        interaction.editReply('<@'+coop.id.toString()+"> doesn't want to fight. Until next time!");
                    }
                })
                .catch(collected => {
                    // No response.
                    interaction.editReply('<@'+coop.id.toString()+"> doesn't want to fight. Until next time!");
                })
        }
    }
}