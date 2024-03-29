const { SlashCommandBuilder } = require("discord.js");
const { riotApiKey } = require("../../../config.json");
const RiotAccount = require("../../models/RiotAccount");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("login")
        .setDescription("Login to the bot.")
        .addStringOption((option) => option.setName("riot_name").setDescription("Riot Name").setRequired(true))
        .addStringOption((option) => option.setName("riot_tag").setDescription("Riot Tag").setRequired(true))
        .addStringOption((option) =>
            option.setName("region").setDescription("Region").setRequired(true).addChoices(
                {
                    name: "North America",
                    value: "americas",
                },
                {
                    name: "Europe",
                    value: "europe",
                },
                {
                    name: "Asia",
                    value: "asia",
                }
            )
        ),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        //await interaction.reply(`This is a test command.  Test Test Test.`);
        await interaction.deferReply();
        const requestURL = `https://${interaction.options.getString(
            "region"
        )}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${interaction.options.getString(
            "riot_name"
        )}/${interaction.options.getString("riot_tag")}?api_key=${riotApiKey}`;

        let puuid = await fetch(requestURL)
            .then((response) => response.body)
            .then((rb) => {
                const reader = rb.getReader();

                return new ReadableStream({
                    start(controller) {
                        // The following function handles each data chunk
                        function push() {
                            // "done" is a Boolean and value a "Uint8Array"
                            reader.read().then(({ done, value }) => {
                                // If there is no more data to read
                                if (done) {
                                    controller.close();
                                    return;
                                }
                                // Get the data and send it to the browser via the controller
                                controller.enqueue(value);
                                push();
                            });
                        }

                        push();
                    },
                });
            })
            .then((stream) =>
                // Respond with our stream
                new Response(stream, { headers: { "Content-Type": "text/html" } }).text()
            )
            .then((result) => {
                // Do things with result
                result = JSON.parse(result);
                return result.puuid;
            });

        console.log(puuid)
        console.log(interaction.user.id)

        const query = {
            userId: interaction.user.id,
        }

        try {
            const user = await RiotAccount.findOne(query);
            if (user) {
                console.log("User already exists in database.")
                await interaction.editReply(`You are already logged in!  If you would like to change your account, please use the /logout command.`);
            } else {
                const newRiotAccount = new RiotAccount({
                    userId: interaction.user.id,
                    riotName: interaction.options.getString("riot_name"),
                    riotTag: interaction.options.getString("riot_tag"),
                    region: interaction.options.getString("region"),
                    puuid: puuid,
                });

                await newRiotAccount.save();
                console.log("User added to database.")
                await interaction.editReply(`User added to database.`);
            }
        } catch (error) {
            console.log("Error finding user in database.")
        }

    },
};
