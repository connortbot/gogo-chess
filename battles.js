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
            console.log(thisGoGoStats);
            const target = side2[0];

            // Damage closest enemy
            var croll = Math.random();
            var damage = thisGoGoStats["ATK"];
            if (croll <= thisGoGoStats["CRITRATE"]) {
                damage = damage*(thisGoGoStats["CRITDMG"]+1);
                await channel.send(thisGoGoStats["name"]+" dealt :boom: **"+damage.toString()+"** :boom: damage to "+target["name"]);
            } else {
                await channel.send(thisGoGoStats["name"]+" dealt **"+damage.toString()+"** damage to "+target["name"]);
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
                        await channel.send(thisGoGoStats["name"]+" used **"+ability[4]+"** on "+target["name"]+" for "+fdmg.toString()+" damage!");
                    }
                }
            }
            if (side2[0]["HP"] <= 0) {
                var killstrings = ["killed","slayed"]
                var kill_str = killstrings[parseInt((Math.random()*killstrings.length))-1];
                await channel.send(thisGoGoStats["name"]+" "+kill_str+" "+target["name"]+"!");
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
                await channel.send(thisGoGoStats["name"]+" dealt :boom: **"+damage.toString()+"** :boom: damage to "+target["name"]);
            } else {
                await channel.send(thisGoGoStats["name"]+" dealt **"+damage.toString()+"** damage to "+target["name"]);
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
                        await channel.send(thisGoGoStats["name"]+" used **"+ability[4]+"** on "+target["name"]+" for "+fdmg.toString()+" damage!");
                    }
                }
            }
            if (side1[0]["HP"] <= 0) {
                var killstrings = ["killed","slayed"]
                var kill_str = killstrings[Math.floor((Math.random()*killstrings.length))];
                await channel.send(thisGoGoStats["name"]+" "+kill_str+" "+target["name"]+"!");
                side1.shift();
            }
            await new Promise(r => setTimeout(r, 100))
        }

        await new Promise(r => setTimeout(r, 500))
        turn += 1
    }
    await channel.send("BATTLE OVER");
    return;
}

module.exports = {
    // start_battle: (Array: GoGoIDs) (Array: GoGo/Boss/MonsterIDs) (String: channelID)
    // => Starts a battle.
    async start_battle(s1,s2,channel) {
        battle_loop(s1,s2,channel);
    }
}
