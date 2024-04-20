const { SlashCommandBuilder } = require("discord.js");
const { riotApiKey } = require("../../../config.json");
const RiotAccount = require("../../models/RiotAccount.cjs");
const { ranks, agents } = require("../../../game-content.json");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("matches").setDescription("Get your match history."),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        await interaction.deferReply();

        const query = {
            userId: interaction.user.id,
        };

        let user;
        try {
            user = await RiotAccount.findOne(query);
            if (user) {
                console.log("User found.  Checking match history.");
                // find user
            } else {
                console.log("User not in database.");
                await interaction.editReply(`You are not logged in.  Please use the /login command to log in.`);
                return;
            }
        } catch (error) {
            console.log("Error finding user in database.");
            return;
        }

        const requestURL = `https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/${user.region}/${user.puuid}?size=5`;
        let games = await fetch(requestURL)
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
                return [result.data[0], result.data[1], result.data[2], result.data[3], result.data[4]];
            });

        const embeds = [
            new EmbedBuilder(),
            new EmbedBuilder(),
            new EmbedBuilder(),
            new EmbedBuilder(),
            new EmbedBuilder(),
        ];

        for (let i = 0; i < embeds.length; i++) {
            let match = {};
            let author = {};
            let playersacs = [];

            for (let j = 0; j < games[i].players.all_players.length; j++) {
                playersacs[j] = Math.round(games[i].players.all_players[j].stats.score / games[i].rounds.length);
                if (`${games[i].players.all_players[j].name}#${games[i].players.all_players[j].tag}` ===
                `${user.riotName}#${user.riotTag}`) {
                    author.kills = games[i].players.all_players[j].stats.kills;
                    author.deaths = games[i].players.all_players[j].stats.deaths;
                    author.assists = games[i].players.all_players[j].stats.assists;
                    author.acs = Math.round(
                        games[i].players.all_players[j].stats.score / games[i].rounds.length
                    );
                    author.team = games[i].players.all_players[j].team;
                    author.agent = {
                        agentName: games[i].players.all_players[j].character
                    };
                    author.agent.icon = await fetch(`https://valorant-api.com/v1/agents`)
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
                        new Response(stream, {
                            headers: { "Content-Type": "text/html" },
                        }).text()
                    )
                    .then((result) => {
                        // Do things with result
                        result = JSON.parse(result);
                        for (let i = 0; i < result.data.length; i++) {
                            if (result.data[i].displayName === author.agent.agentName) {
                                return result.data[i].displayIcon;
                            }
                        }
                    });
                }
            }
            playersacs.sort(function(a, b){return b-a}); 
            switch(playersacs.indexOf(author.acs) + 1) {
                case 1: author.place = "1st"; break;
                case 2: author.place = "2nd"; break;
                case 3: author.place = "3rd"; break;
                default: author.place = `${playersacs.indexOf(author.acs) + 1}th`; break;
            }
            author.placeStatus =
                author.place === "1st" ? " :fire: " : "";

            const map = await fetch(`https://valorant-api.com/v1/maps`)
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
                    new Response(stream, {
                        headers: { "Content-Type": "text/html" },
                    }).text()
                )
                .then((result) => {
                    // Do things with result
                    result = JSON.parse(result);
                    for (let j = 0; j < result.data.length; j++) {
                        if (result.data[j].displayName === games[i].metadata.map) {
                            return result.data[j];
                        }
                    }
                });
            match.map = map.displayName;
            match.mapimage = map.splash;
            match.id = games[i].metadata.matchid;
            match.gameStartTime = games[i].metadata.game_start;
            match.teamScore =
                author.team.toLowerCase() === "red" ? games[i].teams.red.rounds_won : games[i].teams.blue.rounds_won;
            match.enemyScore =
                author.team.toLowerCase() === "red" ? games[i].teams.blue.rounds_won : games[i].teams.red.rounds_won;
            if (match.teamScore > match.enemyScore) {
                match.outcome = "Victory";
            } else if (match.enemyScore > match.teamScore) {
                match.outcome = "Defeat";
            } else {
                match.outcome = "Draw";
            }

            let colors = {
                green: 0x16e5b4,
                red: 0xff4655,
                yellow: 0xcbb765,
            };
            let embedInfo = {};
            if (match.outcome === "Victory") {
                embedInfo.color = colors.green;
            } else if (match.outcome === "Defeat") {
                embedInfo.color = colors.red;
            } else {
                embedInfo.color = colors.yellow;
            }
            embeds[i]
            .setColor(embedInfo.color)
            .setAuthor({
                name: `${author.agent.agentName} | ${author.place} | ${author.acs} ACS`,
                iconURL: author.agent.icon,
                url: `https://tracker.gg/valorant/match/${match.id}`
            })
            .setTitle(`${match.outcome} | ${match.teamScore} - ${match.enemyScore} | <t:${match.gameStartTime}:R>`)
            .addFields({
                name: "Stats",
                value: `K/D/A: ${author.kills}/${author.deaths}/${author.assists}\nMap: ${match.map}`,
                inline: true
            })
            .addFields({
                name: "Match ID",
                value: match.id,
                inline: true
            })
            .setThumbnail(match.mapimage)
            //.setImage(match.mapimage);
        }

        interaction.editReply({ embeds: [embeds[0], embeds[1], embeds[2], embeds[3], embeds[4]] });
    },
};
