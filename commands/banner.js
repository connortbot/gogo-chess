const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { Banner, BannerTitle, BannerSubTitle } = require('../balance.json');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Sell your pathethic gogos away for some bones!')
    .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('Name of your GoGo')
                .setRequired(true)

        ),

     async execute(interaction) {
        // Example on how to access json dictionaries
        //     const banner = bannerTitle - pointless;
        //     const asdsa = Banners["Wanted"]["name1"]; - only needed if you use it multiple times
        //     let foo = Banners["Wanted"]["names"];

        // Example on how to loop through an elements in a json dictionary
            /*
            for (let i=0; i<p.length; i++) {
                let name = p[i];
                write_banner.addFields({ name: name+" :white_check_mark:", value: 'Promoted GoGo!!' })
            }
            */
        
            let banner = Banner["Wanted"]

            for (let i=0; i<banner[i]; i++) {
                let name = banner[i];
                write_banner.addFields({ name: name, value:'Promoted Go!!' })
            }
            await interaction.reply();
     }


}

async function write_banner(interaction) {
    const exampleEmbed = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle(BannerTitle)
	.setDescription(BannerSubTitle)
	.setImage('https://i.imgur.com/AfFp7pu.png')
    await interaction.reply({ embeds: [exampleEmbed] });
}


