const { SlashCommandBuilder } = require("discord.js");
const { riotApiKey } = require("../../../config.json");
const RiotAccount = require("../../models/RiotAccount");
const game = require("../../../game.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("recent")
        .setDescription("Get the statistics of your most recent match."),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        //await interaction.reply(`This is a test command.  Test Test Test.`);
        await interaction.deferReply();

        /*
        const query = {
            userId: interaction.user.id,
        }

        try {
            const user = await RiotAccount.findOne(query);
            if (user) {
                console.log("User found.  Checking match history.")
                // find user
                const puuid = user.puuid;

                const mhRequestURL = ``;
                
                await interaction.editReply(``);
            } else {
                console.log("User not in database.")
                await interaction.editReply(`You are not logged in.  Please use the /login command to log in.`);
                return;
            }
        } catch (error) {
            console.log("Error finding user in database.")
        }
        */

        console.log(game.teams[0].roundsWon, " / ", game.teams[1].roundsWon);

    },
};
