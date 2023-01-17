const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { Collection, Events, ActionRowBuilder, SelectMenuBuilder, Embed, EmbedBuilder } = require('discord.js');
const { NormalGoGos, Weapons, Gear, Dungeons } = require('../balance.json');
const battles = require('../battles');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('dungeon')
        .setDescription('Lists out the dungeons.')
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
        await interaction.deferReply();
        const dungeonName = Object.keys(Dungeons)[interaction.options.getInteger('number')-1];
        const coop = interaction.options.getMentionable('teammateone');
        // Needs to be a check if the player is even registered.
        const user = await database.getUser(interaction.user.id.toString());
        if (user.team.split('-').length == 0) {
            await interaction.editReply('Please form your team first.');
        }
        if (coop == null) {
            for (let i=0; i<Dungeons[dungeonName]["waves"].length; i++) {
                var b = await battles.start_battle(user.team.split('-'),Dungeons[dungeonName]["waves"][i],interaction.channel);
                if (b != "side1") {
                    // Failed the Fight
                    await interaction.editReply('You failed the fight');
                }
                if (b == "noTeam") {
                    await interaction.editReply('You did not select a team. (Use **/team** to set one up)')
                    return
                }
            }
            // Defeated the Dungeon
            await interaction.channel.send('You were awarded the '+Gear[Dungeons[dungeonName]["loot"]]["name"]+' upon clearing this dungeon.');
            const gearID = database.createNewGear(Dungeons[dungeonName]["loot"]);
            await database.giveGearWeapon(interaction.user.id.toString(),gearID);
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
                        // NEED: Combine both player's "teams".
                        for (let i=0; i<Dungeons[dungeonName]["waves"].length; i++) {
                            // PLACEHOLDER: "Sumon#0" is a placeholder. It should be the player's team.
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
                            var b = await battles.start_battle(team,Dungeons[dungeonName]["waves"][i],interaction.channel);
                            if (b != "side1") {
                                // Failed the Fight
                                interaction.editReply('You failed the fight');
                            }
                        }
                        // Defeated the Dungeon
                        await interaction.channel.send('You were awarded the '+Gear[Dungeon[dungeonName]["loot"]]["name"]+' upon clearing this dungeon.');
                        const gearID = database.createNewGear(Dungeon[dungeonName]["loot"]);
                        await database.giveGearWeapon(interaction.user.id.toString(),gearID);
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