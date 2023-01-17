const { SlashCommandBuilder, GatewayIntentBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		// await interaction.reply("This server is "+interaction.guild.name+" and has "+(interaction.guild.members.cache.filter(member => !member.user.bot).size).toString()+ " members."); //wrong number of users? -> produces 1 instead of in a server of 2 users and 1 bot
		// await interaction.reply("This server is "+interaction.guild.name+" and has "+interaction.guild.memberCount+" members."); // number of bots included 
		// console.log(interaction.guild.members); // Connor's testing 
		const m = interaction.guild.memberCount;
		const b = interaction.guild.members.cache.filter(member => member.user.bot).size;
	 	await interaction.reply("This server is "+interaction.guild.name+" and has "+(m - b).toString()+" members."); //wrong number of users?

	},	    
};