const { SlashCommandBuilder, Options, CommandInteractionOptionResolver } = require("discord.js");
const { execute } = require("./weapon");
const db = require('../database'); //get database -> get user
const { removeGoGo } = require("../database");



// actions: get the gogo - determine if the gogo is in possession 
//                       - determine the number of rolls that will be acquired as a result of selling the gogo
//                       - remove the gogo from the database 
//                            (Clear both existance as a gogo in database as well as from the inventory of the user) 
//                       - Update user's quantity of rolls 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sell your pathethic gogos away for some rolls!')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('Name of your GoGo')
                .setRequired(true)

        ),
    
    async execute(interaction) {
        // to get the gogo, first get the user 
        const user = await db.getUser(interaction.user.id.toString()); // get user 
        // get inventory from after getting user 
        // user.inventory gets the string of gogos (ids) in the inventory and split('-') splits the string by the dashes into an array of the gogos 
        const posGoGo = user.inventory.split('-'); 
        const sellValue = 20;
        
        // iterate through the list of inventory (that is now an array to) to check for the name of the gogo inputted
        for (let i=0; i<posGoGo.length; i++) {
            // Gets the ith gogo in posGoGO (the gogo name)
            const gogoName = posGoGo[i].split('#')[0]; // - since the user will be inputting for example just Sumon and posGoGo.[i] returns Sumon#13 we need to just get Sumon
            // to get the name inputted by user: interaction.options.getString('name');
            const name = interaction.options.getString('name');

            if (name === gogoName) {
                // do all the stuff here
                await db.removeGoGo(interaction.user.id.toString(),posGoGo[i]); // call the removeGoGo function (since nothing is returned, cant even store it in a const or var)
                await user.update({rolls: user.rolls+sellValue});
                await interaction.reply("You've successfully received **"+sellValue.toString()+"** for selling " + gogoName); //this will be the final output (reply) back to user once all the computation has be done 
            }
        }
        await interaction.reply("You don't have a GoGo named "+interaction.options.getString('name')+'!'); // this executes if for loop ends and no gogo with the name was found 

                                                   
    }

}