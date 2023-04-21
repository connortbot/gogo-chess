const { SlashCommandBuilder } = require('discord.js');


async function execute(interaction) {
	await interaction.reply(`This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	execute,
};