const { SlashCommandBuilder } = require("discord.js");
const { riotApiKey } = require("../../../config.json");
const RiotAccount = require("../../models/RiotAccount");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("logout")
        .setDescription("Log out of the bot."),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        await interaction.deferReply();

        const query = {
            userId: interaction.user.id,
        }

        try {
            const user = await RiotAccount.deleteOne(query);
            if (user) {
                console.log("User deleted from database.")
                await interaction.editReply(`You have been logged out.`);
            } else {
                console.log("User is not in database.")
                await interaction.editReply(`You are not currently logged in.  Please use the /login command to log in.`);
            }
        } catch (error) {
            console.log("Error finding user in database.")
        }

    },
};
