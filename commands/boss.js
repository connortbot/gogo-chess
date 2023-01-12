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
        await interaction.deferReply();
        const coop = interaction.options.getMentionable('teammateone');
        // Needs to be a check if the player is even registered.
        const user = await database.getUser(interaction.user.id.toString());
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
                var b = await battles.start_battle(user.team.split('-'),["Monster/Dragon K'aeda"],interaction.channel);
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
            // Defeated the Dungeon
            //await interaction.channel.send('You were awarded the '+Gear[Dungeons[dungeonName]["loot"]]["name"]+' upon clearing this dungeon.');
            await interaction.channel.send('There is no loot currently available for this boss.');
            //const gearID = database.createNewGear(Dungeons[dungeonName]["loot"]);
            //await database.giveGearWeapon(interaction.user.id.toString(),gearID);
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
                            var b = await battles.start_battle(team,["Monster/Dragon K'aeda"],interaction.channel);
                            if (b != "side1") {
                                // Failed the Fight
                                interaction.editReply('You failed the fight.');
                            }
                        }
                        // Defeated the Dungeon
                        //await interaction.channel.send('You were awarded the '+Gear[Dungeons[dungeonName]["loot"]]["name"]+' upon clearing this dungeon.');
                        await interaction.channel.send('There is no loot currently available for this boss.');
                        //const gearID = database.createNewGear(Dungeons[dungeonName]["loot"]);
                        //await database.giveGearWeapon(interaction.user.id.toString(),gearID);
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