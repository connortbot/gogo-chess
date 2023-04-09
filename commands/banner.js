<<<<<<< HEAD
// Variable Declarations: 
//     1. Const - Global Data, use as much as possible as more memory efficient
//     2. Var - Modulo scope, remains in memory after you finish the function so it's bad  for memory
//     3. Let - Same as var, 

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { Banners, BannerTitle, Subtitle} = require('../balance.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription("Featuring this set's amazing GoGos that you can try your hand to roll for the best!"),
    
    async execute(interaction) {
        //Get banner data

        //Display banner data

=======
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
>>>>>>> 143c0b9130754434be92293f1c5c486b11bbcb6b
        // Example on how to access json dictionaries
        //     const banner = bannerTitle - pointless;
        //     const asdsa = Banners["Wanted"]["name1"]; - only needed if you use it multiple times
        //     let foo = Banners["Wanted"]["names"];

        // Example on how to loop through an elements in a json dictionary
            /*
            for (let i=0; i<p.length; i++) {
                let name = p[i];
<<<<<<< HEAD
                bannerEmbed.addFields({ name: name+" :white_check_mark:", value: 'Promoted GoGo!!' })
            }
            */

        const wantedBannerEmbed = new EmbedBuilder()
            .setColor(0x9F2B68)
            .setTitle(BannerTitle)
            // Possible implementation: 
            // .setURL('https://discord.js.org/') 
            .setDescription(Subtitle)
            .setImage(Banners["Wanted"]["image"])

        for (let i = 0; i < Banners["Wanted"]["names"].length; ++i) {
            let name = Banners["Wanted"]["names"][i];
            wantedBannerEmbed.addFields({ name: '  ', value: name + " :white_check_mark:", inline: true })
        }

        await interaction.reply({embeds: [wantedBannerEmbed]});
    }
}

=======
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


>>>>>>> 143c0b9130754434be92293f1c5c486b11bbcb6b
