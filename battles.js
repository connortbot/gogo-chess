const index = require("./index");
const database = require("./database");
const calculator = require("./calculator");
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, CommandInteraction, SelectMenuBuilder, ActionRowBuilder, InteractionCollector, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver, ApplicationCommandOptionWithChoicesAndAutocompleteMixin } = require('discord.js');
const { token, dojo } = require('./config.json');
const { Gear, Weapons, NormalGoGos, Monsters } = require('./balance.json');
const { waitForDebugger } = require("node:inspector");

// battle_loop: (Array: GoGoIDs) for each player team) (Array: GoGo/Boss/MonsterIDs) (Array: (Array: side,userID)) (Discord: Channel)
 // => Runs through a battle.
 // => s2 max_size = 4
async function battle_loop(s1,s2,channel) {
    if (s1.length == 1 && s1[0] == '') {
        await channel.send("...one of the sides does not have a team! (Use **/team** to set up a team.)");
        return "noTeam";
    } else {
        var side1 = []
        var side2 = []
        for (let i=0; i<s1.length; i++) {
            var tGoGo = await database.getGoGo(s1[i]);
            const gogoStats = await calculator.calcGoGoStats(tGoGo);
            const gogoDict = {
                "name": tGoGo.id.split('#')[0],
                "type": NormalGoGos[tGoGo.id.split('#')[0]]["type"],
                "ATK": gogoStats[0],
                "HP": gogoStats[1],
                "CRITRATE": gogoStats[2],
                "CRITDMG": gogoStats[3],
                "ABILITY": NormalGoGos[tGoGo.id.split('#')[0]]["ABILITY"],
                "COOLDOWN": NormalGoGos[tGoGo.id.split('#')[0]]["COOLDOWN"],
            }
            side1.push(gogoDict);
        }
        for (let i=0; i<s2.length; i++) {
            if (!s2[i].startsWith('Monster/')) {
                var tGoGo = await database.getGoGo(s2[i]);
                const gogoStats = await calculator.calcGoGoStats(tGoGo);
                const gogoDict = {
                    "name": tGoGo.id.split('#')[0],
                    "type": NormalGoGos[tGoGo.id.split('#')[0]]["type"],
                    "ATK": gogoStats[0],
                    "HP": gogoStats[1],
                    "CRITRATE": gogoStats[2],
                    "CRITDMG": gogoStats[3],
                    "ABILITY": NormalGoGos[tGoGo.id.split('#')[0]]["ABILITY"],
                    "COOLDOWN": NormalGoGos[tGoGo.id.split('#')[0]]["COOLDOWN"],
                }
                side2.push(gogoDict);
            } else {
                var monsterStats = Monsters[s2[i].split('/')[1]];
                monsterStats["name"] = s2[i].split('/')[1];
                side2.push(monsterStats);
            }
        }
        var turn = 1
        while (side1.length>0 && side2.length>0) {
            // SIDE 1
            for (let i=0; i<side1.length; i++) {
                const thisGoGoStats = side1[i];
                const target = side2[0];
    
                // Damage closest enemy
                var croll = Math.random();
                var damage = thisGoGoStats["ATK"];
                if (croll <= thisGoGoStats["CRITRATE"]) {
                    damage = damage*(thisGoGoStats["CRITDMG"]+1);
                    
                // Create embeded text for the ith iteration of the loop 
                const embededText = new EmbedBuilder() 
                    .setColor(0x0099FF)
                    .setTitle(thisGoGoStats["name"]+" dealt :boom: **"+damage.toString()+"** :boom: damage to "+target["name"])

                // sends the message into the channel defined in index 
                await channel.send({ embeds: [embededText] }); 
                // await channel.send(thisGoGoStats["name"]+" dealt :boom: **"+damage.toString()+"** :boom: damage to "+target["name"]); - original non-embeded message 

                } else {
                    // Create embeded text for the ith iteration of the loop 
                const embededText = new EmbedBuilder() 
                    .setColor(0x0099FF)
                    .setTitle(thisGoGoStats["name"]+" dealt **"+damage.toString()+"** damage to "+target["name"])

                // sends the message into the channel defined in index 
                await channel.send({ embeds: [embededText] }); 
                // await channel.send(thisGoGoStats["name"]+" dealt **"+damage.toString()+"** damage to "+target["name"]);
                }
                side2[0]["HP"] = side2[0]["HP"]-damage;
    
                // Use ability
                var ability = thisGoGoStats["ABILITY"];
                var cooldown = thisGoGoStats["COOLDOWN"];
                if (turn % cooldown === 0) {
                    if (ability[0] == "damage") {
                        const fdmg = damage*ability[1];
                        if (ability[3]=="Nearest") {
                            side2[0]["HP"] = side2[0]["HP"]-fdmg;
    
                        // Create embeded text for the ith iteration of the loop 
                        const embeddedText = new EmbedBuilder() 
                        .setColor(0xad11f5) // #ad11f5 purple 
                        .setTitle(":crossed_swords:  "+thisGoGoStats["name"]+" used **"+ability[4]+"** on "+target["name"]+" for "+fdmg.toString()+" damage!  :crossed_swords:")

                        // sends the message into the channel defined in index 
                        await channel.send({ embeds: [embeddedText] }); 
                        // await channel.send(thisGoGoStats["name"]+" used **"+ability[4]+"** on "+target["name"]+" for "+fdmg.toString()+" damage!"); - original non-embeded message
                        }
                    }
                }
                if (side2[0]["HP"] <= 0) {
                    var killstrings = ["killed","slayed","annihilated","destroyed","defeated","murdered","decimated","obliterated"]
                    var kill_str = killstrings[Math.floor((Math.random()*killstrings.length))];
                    // Create embeded text for the ith iteration of the loop 
                const embeddedText = new EmbedBuilder() 
                .setColor(0x880808) // #880808 - bloody red
                .setTitle(thisGoGoStats["name"]+" "+kill_str+" "+target["name"]+"!")

                // sends the message into the channel defined in index 
                await channel.send({ embeds: [embeddedText] }); 
                // await channel.send(thisGoGoStats["name"]+" "+kill_str+" "+target["name"]+"!"); - original non-embedded message 

                    side2.shift();
                }
                await new Promise(r => setTimeout(r, 100))
            }
            // SIDE 2
            for (let i=0; i<side2.length; i++) {
                const thisGoGoStats = side2[i]; //this also refers to Monsters.
                const target = side1[0];
                // Damage closest enemy
                var croll = Math.random();
                var damage = thisGoGoStats["ATK"];
                if (croll <= thisGoGoStats["CRITRATE"]) {
                    damage = damage*(thisGoGoStats["CRITDMG"]+1);
    
                // Create embeded text for the ith iteration of the loop 
                const embeddedText = new EmbedBuilder() 
                    .setColor(0xd80000) // #d80000 - red
                    .setTitle(thisGoGoStats["name"]+" dealt :boom: **"+damage.toString()+"** :boom: damage to "+target["name"])

                // sends the message into the channel defined in index 
                await channel.send({ embeds: [embeddedText] }); 
                // await channel.send(thisGoGoStats["name"]+" dealt :boom: **"+damage.toString()+"** :boom: damage to "+target["name"]); - original non-embedded message 
                } else {
                    // Create embeded text for the ith iteration of the loop 
                const embededText = new EmbedBuilder() 
                    .setColor(0xd80000) // #d80000 - red
                    .setTitle(thisGoGoStats["name"]+" dealt **"+damage.toString()+"** damage to "+target["name"])

                // sends the message into the channel defined in index 
                await channel.send({ embeds: [embededText] }); 
                // await channel.send(thisGoGoStats["name"]+" dealt **"+damage.toString()+"** damage to "+target["name"]); - original non-embedded message 
                }
                side1[0]["HP"] = side1[0]["HP"]-damage;
    
                // Use ability
                var ability = thisGoGoStats["ABILITY"];
                var cooldown = thisGoGoStats["COOLDOWN"];
                if (turn % cooldown === 0) {
                    if (ability[0] == "damage") {
                        const fdmg = damage*ability[1];
                        if (ability[3]=="Nearest") {
                            side1[0]["HP"] = side1[0]["HP"]-fdmg;
    
                        // Create embeded text for the ith iteration of the loop 
                        const embeddedText = new EmbedBuilder() 
                        .setColor(0xad11f5) // #ad11f5 purple 
                        .setTitle(":crossed_swords:  "+thisGoGoStats["name"]+" used **"+ability[4]+"** on "+target["name"]+" for "+fdmg.toString()+" damage!  :crossed_swords:")

                        // sends the message into the channel defined in index 
                        await channel.send({ embeds: [embeddedText] }); 
                        // await channel.send(thisGoGoStats["name"]+" used **"+ability[4]+"** on "+target["name"]+" for "+fdmg.toString()+" damage!"); - original non-embedded message
                        }
                    }
                }
                if (side1[0]["HP"] <= 0) {
                    var killstrings = ["killed","slayed"]
                    var kill_str = killstrings[Math.floor((Math.random()*killstrings.length))];
                    // Create embeded text for the ith iteration of the loop 
                const embeddedText = new EmbedBuilder() 
                .setColor(0x880808) // #880808 - bloody red
                .setTitle(":drop_of_blood:  "+thisGoGoStats["name"]+" "+kill_str+" "+target["name"]+"!  :drop_of_blood:")

                // sends the message into the channel defined in index 
                await channel.send({ embeds: [embeddedText] }); 
                // await channel.send(thisGoGoStats["name"]+" "+kill_str+" "+target["name"]+"!"); - original non-embedded message 
                    side1.shift();
                }
                await new Promise(r => setTimeout(r, 100))
            }
    
            await new Promise(r => setTimeout(r, 500))
            turn += 1
        }
        await channel.send("BATTLE OVER");
        if (side1.length == 0) {
            return "side2";
        } else {
            return "side1";
        }
    }
    // Create embeded text for the ith iteration of the loop 
    const embeddedText = new EmbedBuilder() 
    .setColor(0xFFDF00) // #FFDF00 - yellow
    .setTitle("***:trophy:   BATTLE OVER   :trophy:***")

    // sends the message into the channel defined in index 
    await channel.send({ embeds: [embeddedText] }); 
    // await channel.send("BATTLE OVER");

    return;
}

module.exports = {
    // start_battle: (Array: GoGoIDs) (Array: GoGo/Boss/MonsterIDs) (String: channelID)
    // => Starts a battle.
    async start_battle(s1,s2,channel) {
        var b = await battle_loop(s1,s2,channel);
        return b;
    }
}
