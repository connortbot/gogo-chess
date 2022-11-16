const { SlashCommandBuilder } = require('discord.js');
const database = require('../database');
const { ActionRowBuilder, SelectMenuBuilder, Embed } = require('discord.js');
const { NormalGoGos, Weapons, Gear } = require('../balance.json');

// KNOWN BUGS:
//// If you put in a nonexistent gear name or alias, itll just error out.

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gear')
		.setDescription('Equips GoGos with gear.')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('Name of your GoGo')
                .setRequired(true),
                )
        .addStringOption((option) =>
            option
                .setName('gear')
                .setDescription('Name of your Gear')
                .setRequired(true),
                )
        .addIntegerOption((option) =>
            option
                .setName('slot')
                .setDescription('The slot to place the gear in.')
                .setRequired(true),
                ),
	async execute(interaction) {
        if (!Object.keys(Gear).includes(interaction.options.getString('gear'))) {
            var names_and_aliases = []
            for (let k in Gear) {
                names_and_aliases.push(Gear[k]["name"]);
                names_and_aliases.push(Gear[k]["alias"]);
            }
            console.log(names_and_aliases);
            if (!names_and_aliases.includes(interaction.options.getString('gear'))) {
                await interaction.reply('There is no existing gear called by '+interaction.options.getString('gear')+'.');
            }
        }
        
        const user = await database.getUser(interaction.user.id.toString());
        const gogos = user.inventory.split('-');
        var gear = user.gear.split('-');
        var gogoID;
        for (let i=0; i<gogos.length; i++) {
            if (gogos[i].startsWith(interaction.options.getString('name'))) {
                gogoID = gogos[i];
                break;
            }
        }
        const menu = new SelectMenuBuilder().setCustomId('selectGear'+'-'+interaction.options.getInteger('slot').toString()+'-'+gogoID).setPlaceholder('Nothing selected');
        for (let i=0; i<gear.length; i++) {
            if (!gear[i].startsWith('Weapon')) {
                if (Gear[gear[i].split('#')[0]]["name"] == interaction.options.getString('gear') || Gear[gear[i].split('#')[0]]["alias"] == interaction.options.getString('gear')) {
                    menu.addOptions({
                        label: Gear[gear[i].split('#')[0]]["name"],
                        description: 'LVL: '+((await database.getGear(gear[i])).lvl).toString(),
                        value: gear[i]
                    });
                }
            }
        }
        const dropdown = new ActionRowBuilder()
            .addComponents(
                menu
            )
        const reply = await interaction.reply({content: 'Select one of your Gears:', components: [dropdown]});
	},
};