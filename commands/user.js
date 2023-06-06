const { SlashCommandBuilder } = require('discord.js');
const battles = require('../battles');
const database = require('../database')

async function execute(interaction) {
	//const usr = await database.getUser(interaction.user.id.toString());
	//await battles.start_battle(["Sumon#0"],['Monster/Skeleton'],interaction.channel,[usr]);

	await interaction.reply(`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	execute,
};