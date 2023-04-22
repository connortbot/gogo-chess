const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder, Embed } = require('discord.js');
const database = require('../database')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Join us in GoGo World!'),
    async execute(interaction) {
        const embed = generateEmbed(interaction);
        database.createNewUser(interaction.user.id.toString());
        await interaction.reply({embeds: [embed]});
    }
}


// generateEmbed: interaction
function generateEmbed(interaction) {
    const title = "Hi "+interaction.user.username + ", welcome to GoGo World!";
    const description = "You've been gifted a **Sumon** and **5 rolls** to start your journey. Good luck!";
    const regular_field = { name: 'To get started:', value: 'Use the command **/help**' };
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .addFields(
            regular_field,
        );
    return embed
}