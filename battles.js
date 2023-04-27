const index = require("./index");
const database = require("./database");
const calculator = require("./calculator");
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, CommandInteraction, SelectMenuBuilder, ActionRowBuilder, InteractionCollector, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver, ApplicationCommandOptionWithChoicesAndAutocompleteMixin, GuildForumThreadManager } = require('discord.js');
const { Gear, Weapons, NormalGoGos, Monsters } = require('./balance.json');
const { waitForDebugger } = require("node:inspector");

/**
 * Returns boolean, true if the dictionaries are the same.
 * @param {Object} dict1 
 * @param {Object} dict2 
 * @returns {boolean}
 */
function cmp_dicts(dict1, dict2) {
    const keys1 = Object.keys(dict1);
    const keys2 = Object.keys(dict2);
  
    // Check if both dictionaries have the same number of keys
    if (keys1.length !== keys2.length) {
      return false;
    }
  
    // Iterate through the keys of the first dictionary
    for (let key of keys1) {
      // Check if the key exists in the second dictionary and if the values are equal
      if (!keys2.includes(key) || dict1[key] !== dict2[key]) {
        return false;
      }
    }
  
    // If all keys and values match, the dictionaries are equal
    return true;
  }


/**
 * Runs all the abilities. Returns message for embed.
 * @param {Array} ability 
 * @param {Array} full 
 * @param {number} side 
 * @param {*} stats 
 */
async function cast_ability(ability, full, side,stats,dead) {
    // REMINDER: ability -> [ Type, Main Scaling, Target Statistic, Targeting, Name ]
    // Type: damage/heal/buff/revive
    // Main Scaling: Integer
    // Target Statistic: HP/CRIT....etc.
    // Targeting: Nearest/Farthest (Buff: Backline/Frontline)
    // Name: String
    // see balance.json for update
    let target = 0;
    if (side == 0) {
        target = 1;
    } else {
        target = 0;
    }

    const damage = stats["ATK"];
    if (ability[0] === "damage") {
        const fdmg = damage*ability[1];
        let targeted_enemy = 0;
        if (ability[3]=="Nearest") {
            full[target][0]["HP"] = full[target][0]["HP"]-fdmg;
        } else if (ability[3]=="Farthest") {
            const last_index = full[target].length - 1;
            targeted_enemy = last_index;
            full[target][last_index]["HP"] = full[target][last_index]["HP"]-fdmg;
        }
        return ":crossed_swords:  "+stats["name"]+" used **"+ability[4]+"** on "+full[target][targeted_enemy]["name"]+" for "+fdmg.toString()+" damage!  :crossed_swords:"
    } else if (ability[0] === "heal") {
        let targeted_ally = 0;
        if (full[side].length > 1) {
            if (cmp_dicts(full[side][0],stats)) {
                targeted_ally = 1;
            } else {
                targeted_ally = 0;
            }
        } else {
            targeted_ally = 0;
        }
        const heal = (ability[1] * full[side][targeted_ally]["MAXHP"]);
        const new_health = Math.min(full[side][targeted_ally]["MAXHP"],full[side][targeted_ally]["HP"]+heal);
        full[side][targeted_ally]["HP"] = new_health;
        return ":green_heart: "+stats["name"]+" healed "+full[side][targeted_ally]["name"]+" for "+heal.toString()+" health using **"+ability[4]+"**! :green_heart:";
    } else if (ability[0] == "buff") {
        let targeted_ally = 0;
        if (ability[3] == "Backline") {
            targeted_ally = full[side].length - 1;
        } else if (ability[3] == "Frontline") {
            targeted_ally = 0;
        }
        const buff = (ability[1] * full[side][targeted_ally][ability[2]]);
        const new_stat = full[side][targeted_ally][ability[2]] + buff;
        full[side][targeted_ally][ability[2]] = new_stat;
        return ":up: "+stats["name"]+" boosted "+full[side][targeted_ally]["name"]+"'s "+ability[2]+" by "+(ability[1]*100).toString()+"% using **"+ability[4]+"**! :up:";
    } else if (ability[0] == "revive") {
        let revived;
        let revive = false;
        for (let i=0; i<dead[side].length; i++) {
            if (dead[side][i] != null) {
                revived = {...dead[side][i]};
                full[side].push(revived);
                full[side][(full[side].length - 1)]["HP"] = full[side][(full[side].length - 1)]["MAXHP"] * ability[2];
                dead[side][i] = null;
                full[side].sort((a,b) => a["init_position"] - b["init_position"]);
                revive = true;
                break;
            }
        }
        if (revive) {
            return ":revolving_hearts: "+stats["name"]+" revived "+revived["name"]+" to "+(ability[1]*100).toString()+"% HP using **"+ability[4]+"**! :revolving_hearts:";
        } else {
            return stats["name"]+" found no ally to revive!";
        }
    }
}


async function death_check(side,dead,channel) {
    for (let i=0; i<side.length; i++) {
        if (side[i]["HP"] <= 0) {
            dead[side[i]["init_position"]] = side[i];
            let dead_ix = side[i]["init_position"];
            side.splice(i,1);
            const killstrings = ["killed","slayed","annihilated","destroyed","defeated","murdered","decimated","obliterated"];
            let kill_str = killstrings[Math.floor((Math.random()*killstrings.length))];
            const embeddedText = new EmbedBuilder() 
                .setColor(0x880808) // #880808 - bloody red
                .setTitle(dead[dead_ix]["name"]+" was "+kill_str+"!")
            await channel.send({ embeds: [embeddedText] }); 
        }
    }
    if (side.length == 0) {
        return true;
    } else {
        return false;
    }
}

/**
 * Runs through a battle loop between two given sides.
 * @param {Array} s1 - Array for GogoIDs for side 1
 * @param {Array} s2 - Array for opposing player team IDs or Boss/Monster IDs
 * @param {Channel} channel - Channel that the battle was called in.
 */
async function battle_loop(s1,s2,channel) {
    if (s1.length == 1 && s1[0] == '') {
        await channel.send("...one of the sides does not have a team! (Use **/team** to set up a team.)");
        return "noTeam";
    } else {
        var side1 = [];
        var side2 = [];
        let side1_dead = [];
        let side2_dead = [];
        for (let i=0; i<s1.length; i++) {
            var tGoGo = await database.getGoGo(s1[i]);
            const gogoStats = await calculator.calcGoGoStats(tGoGo);
            const gogoDict = {
                "name": tGoGo.id.split('#')[0],
                "type": NormalGoGos[tGoGo.id.split('#')[0]]["type"],
                "ATK": gogoStats[0],
                "HP": gogoStats[1],
                "MAXHP": gogoStats[1],
                "CRITRATE": gogoStats[2],
                "CRITDMG": gogoStats[3],
                "ABILITY": NormalGoGos[tGoGo.id.split('#')[0]]["ABILITY"],
                "COOLDOWN": NormalGoGos[tGoGo.id.split('#')[0]]["COOLDOWN"],
                "init_position": i
            }
            side1.push(gogoDict);
            side1_dead.push(null);
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
                    "MAXHP": gogoStats[1],
                    "CRITRATE": gogoStats[2],
                    "CRITDMG": gogoStats[3],
                    "ABILITY": NormalGoGos[tGoGo.id.split('#')[0]]["ABILITY"],
                    "COOLDOWN": NormalGoGos[tGoGo.id.split('#')[0]]["COOLDOWN"],
                    "init_position": i,
                }
                side2.push(gogoDict);
            } else {
                var monsterStats = {...Monsters[s2[i].split('/')[1]]};
                monsterStats["name"] = s2[i].split('/')[1];
                monsterStats["MAXHP"] = monsterStats["HP"];
                monsterStats["init_position"] = i;
                side2.push(monsterStats);
            }
            side2_dead.push(null);
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
                    const embededText = new EmbedBuilder() 
                        .setColor(0x0099FF)
                        .setTitle(thisGoGoStats["name"]+" dealt :boom: **"+damage.toString()+"** :boom: damage to "+target["name"])

                    await channel.send({ embeds: [embededText] }); 
                } else {
                    const embededText = new EmbedBuilder() 
                        .setColor(0x0099FF)
                        .setTitle(thisGoGoStats["name"]+" dealt **"+damage.toString()+"** damage to "+target["name"])

                    await channel.send({ embeds: [embededText] }); 
                }
                side2[0]["HP"] = side2[0]["HP"]-damage;
    
                // Use ability
                var ability = thisGoGoStats["ABILITY"];
                var cooldown = thisGoGoStats["COOLDOWN"];
                if (turn % cooldown === 0) {
                    let embedMsg = await cast_ability(ability,[side1,side2],0,thisGoGoStats,[side1_dead,side2_dead]);
                    const embeddedText = new EmbedBuilder() 
                        .setColor(0xad11f5) // #ad11f5 purple 
                        .setTitle(embedMsg);

                    await channel.send({ embeds: [embeddedText] }); 
                }
                let side2_defeated = await death_check(side2,side2_dead,channel);
                if (side2_defeated) {return "side1";}
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
                } else {
                    const embededText = new EmbedBuilder() 
                        .setColor(0xd80000) // #d80000 - red
                        .setTitle(thisGoGoStats["name"]+" dealt **"+damage.toString()+"** damage to "+target["name"])

                    await channel.send({ embeds: [embededText] }); 
                }
                side1[0]["HP"] = side1[0]["HP"]-damage;
                // Use ability
                var ability = thisGoGoStats["ABILITY"];
                var cooldown = thisGoGoStats["COOLDOWN"];
                if (turn % cooldown === 0) {
                    let embedMsg = await cast_ability(ability,[side1,side2],1,thisGoGoStats,[side1_dead,side2_dead]);
                    const embeddedText = new EmbedBuilder() 
                        .setColor(0xad11f5) // #ad11f5 purple 
                        .setTitle(embedMsg);

                    await channel.send({ embeds: [embeddedText] }); 
                }
                let side1_defeated = await death_check(side1,side1_dead,channel);
                if (side1_defeated) {return "side2";}
                await new Promise(r => setTimeout(r, 100))
            }
    
            await new Promise(r => setTimeout(r, 500))
            turn += 1
        }
        const embeddedText = new EmbedBuilder() 
            .setColor(0xFFDF00) // #FFDF00 - yellow
            .setTitle("***:trophy:   BATTLE OVER   :trophy:***")
        await channel.send({ embeds: [embeddedText] }); 
        // await channel.send("BATTLE OVER");
        if (side1.length == 0) {
            return "side2";
        } else {
            return "side1";
        }
    return;
    }
}

module.exports = {
    /**
     * 
     * @param {Array} s1 
     * @param {Array} s2 
     * @param {Channel} channel 
     * @param {Array} players - List of all players involved in the battle.
     * @returns 
     */
    async start_battle(s1,s2,channel,players) {
        for (let i=0; i<players.length; i++) {
            let p = players[i];
            const limits = p.fight_limits.split('-');
            p.fight_limits = `${limits[0]}-${limits[1]}-1-${limits[3]}-${limits[4]}`;
            await p.save();
        }
        var b = await battle_loop(s1,s2,channel);
        for (let i=0; i<players.length; i++) {
            let p = players[i];
            const limits = p.fight_limits.split('-');
            p.fight_limits = `${limits[0]}-${limits[1]}-0-${limits[3]}-${limits[4]}`;
            await p.save();
        }
        return b;
    }
}
