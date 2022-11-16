// REQUIRED MODULES: NODE: SEQUELIZE, DISCORD.JS
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, CommandInteraction, SelectMenuBuilder, ActionRowBuilder, InteractionCollector, ButtonBuilder, ButtonStyle, CommandInteractionOptionResolver, ApplicationCommandOptionWithChoicesAndAutocompleteMixin } = require('discord.js');
const { token, dojo } = require('./config.json');
const { NormalGoGos, Weapons, Gear } = require('./balance.json');
const calculator = require('./calculator');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions] });
const database = require('./database');
const schedule = require('node-schedule');
const { channel } = require('node:diagnostics_channel');


client.commands = new Collection();
const commandsPath = path.join(__dirname,'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

});

// COMMAND INTERACTIONS //
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    try {
        await command.execute(interaction);
	} catch (error) {
		console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

//GEARING GOGOS
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isSelectMenu()) return;
	if (interaction.customId.startsWith('selectGear')) {
		const gogoID = interaction.customId.split('-')[2];
		const slot = interaction.customId.split('-')[1];
		const gear = interaction.values[0];
		const lostGearGoGo = await database.GearGoGo(gogoID,gear,interaction.user.id.toString(),parseInt(slot));
        
		if (lostGearGoGo != 'firstGearing') {
			if (gear.length==0) {
				embed = new EmbedBuilder()
					.setTitle(lostGearGoGo.split('#')[0]+" unequipped their "+Gear[gear.split('#')[0]]["name"]+"!");
				await interaction.channel.send({embeds: [embed]});
			}
		}
		embed = new EmbedBuilder()
			.setTitle(gogoID.split('#')[0]+" equipped the "+Gear[gear.split('#')[0]]["name"]+"!");
		await interaction.reply({embeds: [embed]});
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;
	await interaction.deferUpdate();
	var embed = new EmbedBuilder()
            .setColor(0xFF5634)
            .setTitle(interaction.user.username)
    const user = await database.getUser(interaction.user.id.toString());
    const gear = user.gear;
    const gogos = user.inventory;
	// Menu to Show GoGos
	if (interaction.customId === 'showGoGos') {
		const lst = gogos.split('-');
		if (lst.length == 0) {
			embed.setTitle(interaction.user.username+" has no GoGos!");
			return
		}
		embed.setFooter({text: 'PAGE 1/'+parseInt(Math.ceil(lst.length/5)).toString()})
		var pageButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prevPage-gogo-0')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('nextpage-gogo-0')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary),
        )
		var l
		if (lst.length < 5) {
			l = lst.length;
		} else {
			l = 5;
		}
		for (let i=0; i<l; i++) {
			var tGoGo = await database.getGoGo(lst[i]);
			const description = "LVL "+tGoGo.lvl.toString()
			embed.addFields(
				{ name: "`"+(i+1).toString()+".` "+"**"+lst[i].split('#')[0]+"**", value: description});
		}
		await interaction.editReply({embeds: [embed],components: [pageButtons]});
	} else if (interaction.customId === 'showWeapons') {
		var lst = gear.split('-');
		for (let i=0; i<lst.length; i++) {
			if (!lst[i].startsWith('Weapon/')) {
				lst.splice(i,1);
				i -= 1;
			}
		}
		if (lst.length == 0) {
			embed.setTitle(interaction.user.username+" as no Weapons!");
			return
		}
		embed.setFooter({text: 'PAGE 1/'+parseInt(Math.ceil(lst.length/5)).toString()})
		var pageButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prevPage-weapon-0')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('nextpage-weapon-0')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary),
        )
		var l
		if (lst.length < 5) {
			l = lst.length;
		} else {
			l = 5;
		}
		for (let i=0; i<l; i++) {
			var tWeapon = await database.getWeapon(lst[i]);
			const weaponBoosts = await calculator.calcWeaponStats(lst[i].split('#')[0].split('/')[1],tWeapon.lvl);
			const descATK = ", ATK "+weaponBoosts[0].toString()
			const descCR = ", CRIT RATE "+(weaponBoosts[1]*100).toString()+"%"
			const descCD = ", CRIT DMG "+(weaponBoosts[2]*100).toString()+"%"
			const description = "*LVL "+tWeapon.lvl.toString()+descATK+descCR+descCD+"*";
			(weaponBoosts[0]+Weapons[lst[i].split('#')[0].split('/')[1]]["ATK"])
			embed.addFields(
				{ name: "`"+(i+1).toString()+".` "+"**"+Weapons[lst[i].split('#')[0].split('/')[1]]["name"]+"**", value: description});
		}
		await interaction.editReply({embeds: [embed],components: [pageButtons]});
	} else if (interaction.customId === 'showGear') {
		var lst = gear.split('-');
		for (let i=0; i<lst.length; i++) {
			if (lst[i].startsWith('Weapon/')) {
				lst.splice(i,1);
				i -= 1;
			}
		}
		if (lst.length == 0) {
			embed.setTitle(interaction.user.username+" as no Gear!");
			return
		}
		embed.setFooter({text: 'PAGE 1/'+parseInt(Math.ceil(lst.length/5)).toString()})
		var pageButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prevPage-gear-1')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('nextpage-gear-1')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary),
        )
		if (lst.length < 5) {
			l = lst.length;
		} else {
			l = 5;
		}
		for (let i=0; i<l; i++) {
			var g = await database.getGear(lst[i]);
			var description = "*LVL "+g.lvl.toString();
			if (g.ATK >= 1) {
				description += ", ATK "+g.ATK.toString();
			} else {
				description += ", ATK% +"+(g.ATK*100).toString()+"%";
			}
			if (g.HP >= 1) {
				description += ", HP "+g.HP.toString();
			} else {
				description += ", HP% +"+(g.HP*100).toString()+"%";
			}
			description += ", CRIT RATE "+(g.CRITRATE*100).toString()+"%";
			description += ", CRIT DMG "+(g.CRITDMG*100).toString()+"%";
			embed.addFields(
				{ name: "`"+(i+1).toString()+".` "+"**"+Gear[lst[i].split('#')[0]]["name"]+"**", value: description+"*"});
		}
		await interaction.editReply({embeds: [embed],components: [pageButtons]});
	}
	if (interaction.customId.startsWith('prevPage') || interaction.customId.startsWith('nextpage')) {
		const type = interaction.customId.split('-')[1];
		const page = interaction.customId.split('-')[2];
		var lst
		if (type == 'gogo') {
			lst = gogos.split('-');
		} else if (type == 'weapon') {
			lst = gear.split('-');
			for (let i=0; i<lst.length; i++) {
				if (!lst[i].startsWith('Weapon/')) {
					lst.splice(i,1);
					i -= 1
				}
			}
		} else if (type == 'gear') {
			lst = gear.split('-');
			for (let i=0; i<lst.length; i++) {
				if (lst[i].startsWith('Weapon/')) {
					lst.splice(i,1);
					i -= 1;
				}
			}
		}
		const msg = interaction.message;
		if ((parseInt(page)-1) == 0 && interaction.customId.startsWith('prevPage')) {
			return
		}
		if (parseInt(page)+1 > parseInt(Math.ceil(lst.length/5)) && interaction.customId.startsWith('nextpage')) {
			return
		}
		var newpagenumber
		if (interaction.customId.startsWith('prevPage')) {
			newpagenumber = (parseInt(page)-1)
			embed.setFooter({text: 'PAGE '+newpagenumber.toString()+'/'+parseInt(Math.ceil(lst.length/5)).toString()})
		} else if (interaction.customId.startsWith('nextpage')) {
			newpagenumber = (parseInt(page)+1)
			embed.setFooter({text: 'PAGE '+newpagenumber.toString()+'/'+parseInt(Math.ceil(lst.length/5)).toString()})
		}
		var pageButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prevPage-'+interaction.customId.split('-')[1]+'-'+newpagenumber.toString())
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('nextpage-'+interaction.customId.split('-')[1]+'-'+newpagenumber.toString())
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary),
        )
		var l
		l = parseInt(newpagenumber)*5;
		for (let i=newpagenumber*5-5; i<Math.min(l,lst.length); i++) {
			if (type=='gogo') {
				var tGoGo = await database.getGoGo(lst[i]);
				const description = "LVL "+tGoGo.lvl.toString()
				embed.addFields(
					{ name: "`"+(i+1).toString()+".` "+"**"+lst[i].split('#')[0]+"**", value: description});
			} else if (type=='weapon') {
				var tWeapon = await database.getWeapon(lst[i]);
				const weaponBoosts = await calculator.calcWeaponStats(lst[i].split('#')[0].split('/')[1],tWeapon.lvl);
				const descATK = ", ATK "+weaponBoosts[0].toString()
				const descCR = ", CRIT RATE "+(weaponBoosts[1]*100).toString()+"%"
				const descCD = ", CRIT DMG "+(weaponBoosts[2]*100).toString()+"%"
				const description = "*LVL "+tWeapon.lvl.toString()+descATK+descCR+descCD+"*";
				(weaponBoosts[0]+Weapons[lst[i].split('#')[0].split('/')[1]]["ATK"])
				embed.addFields(
					{ name: "`"+(i+1).toString()+".` "+"**"+Weapons[lst[i].split('#')[0].split('/')[1]]["name"]+"**", value: description});
			} else if (type=='gear') {
				var g = await database.getGear(lst[i]);
				var description = "*LVL "+g.lvl.toString();
				if (g.ATK >= 1) {
					description += ", ATK "+g.ATK.toString();
				} else {
					description += ", ATK% +"+(g.ATK*100).toString()+"%";
				}
				if (g.HP >= 1) {
					description += ", HP "+g.HP.toString();
				} else {
					description += ", HP% +"+(g.HP*100).toString()+"%";
				}
				description += ", CRIT RATE "+(g.CRITRATE*100).toString()+"%";
				description += ", CRIT DMG "+(g.CRITDMG*100).toString()+"%";
				embed.addFields(
					{ name: "`"+(i+1).toString()+".` "+"**"+Gear[lst[i].split('#')[0]]["name"]+"**", value: description+"*"});
			}
		}
		await interaction.editReply({embeds: [embed],components: [pageButtons]});
	}
});


client.login(token);

//// DAILY REFRESHES ///
//con minute hour
schedule.scheduleJob('0 0 * * *', async () => {
	const users = await database.getUsers();
	for (let i = 0; i<users.length; i++) {
		let user = users[i];
		const gogo = await database.getGoGo(user.training);
		const leveled = await database.levelGoGo(user.training);
		if (leveled) {
			const channel = client.channels.cache.get(dojo);
			channel.send("<@"+user.id+">'s **"+gogo.id.split('#')[0]+"** has leveled up!");
		}
	}
});

