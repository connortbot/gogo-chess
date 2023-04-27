const { SlashCommandBuilder, StringSelectMenuBuilder } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, Embed } = require('discord.js');
const database = require('../database')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('train')
        .setDescription('Join us in GoGo World!'),
    async execute(interaction) {
        const user = await database.getUser(interaction.user.id.toString());
        var gogos = user.inventory.split('-');
        const menu = new StringSelectMenuBuilder().setCustomId('selectTraining-'+interaction.user.id.toString()).setPlaceholder('Nothing selected');
        for (let i=0; i<gogos.length; i++) {
            menu.addOptions({
                label: gogos[i].split('#')[0],
                description: 'One of your GoGos!',
                value: gogos[i]
            });
        }
        const dropdown = new ActionRowBuilder()
            .addComponents(
                menu
            )
        await interaction.reply({content: 'Select one of your GoGos:', components: [dropdown]});
    }
}