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
                .setRequired(true))
        .addMentionableOption((option) =>
            option
                .setName('teammateone')
                .setDescription('Ping your teammate!'),),
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
        const coop = interaction.options.getMentionable('teammateone');
        if (user.team.split('-').length == 0) {
            await interaction.editReply('Please form your team first.');
        }
        if (coop == null) {
            for (let i=0; i<Dungeons[dungeonName]["waves"].length; i++) {
                var b = await battles.start_battle(user.team.split('-'),Dungeons[dungeonName]["waves"][i],interaction.channel,[user]);
                if (b != "side1") {
                    // Failed the Fight
                    await updateLimits([user]);
                    await interaction.editReply('You failed the fight');
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
        } else {
            const coopUser = await database.getUser(coop.user.id.toString());
            if (coopUser.team.split('-').length == 0) {
                await interaction.editReply('<@'+coop.id.toString()+">, please form your team.");
            }
            await interaction.channel.send('<@'+coop.id.toString()+">, would you like to join <@"+interaction.user.id.toString()+"> to conquer this dungeon? (type Y)");
            const filter = response => (response.author.id.toString() === coop.id.toString() && response.author.id.toString() != coop.id.toString());
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                .then(async collected => {
                    if (collected.first().content == 'Y') {
                        for (let i=0; i<Dungeons[dungeonName]["waves"].length; i++) {
                            var team = [];
                            var uTeam = user.team.split('-');
                            var cTeam = user.team.split('-');
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
                            var b = await battles.start_battle(team,Dungeons[dungeonName]["waves"][i],interaction.channel,[user,coopUser]);
                            if (b != "side1") {
                                // Failed the Fight
                                await updateLimits([user,coopUser]);
                                interaction.editReply('You failed the fight');
                            }
                        }
                        // Defeated the Dungeon
                        await updateLimits([user,coopUser]);
                        await interaction.channel.send('You were awarded the '+Gear[Dungeons[dungeonName]["loot"]]["name"]+' and '+Dungeons[dungeonName]["bones"].toString()+' bones upon clearing this dungeon.');
                        const gearID = database.createNewGear(Dungeon[dungeonName]["loot"]);
                        await database.giveGearWeapon(interaction.user.id.toString(),gearID);
                        await database.giveBones(interaction.user.id.toString(),Dungeons[dungeonName]["bones"]);
                        await interaction.editReply(interaction.user.username+' cleared the '+dungeonName+'.');
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