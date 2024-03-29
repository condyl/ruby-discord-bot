const { SlashCommandBuilder } = require("discord.js");
const { riotApiKey } = require("../../../config.json");
const RiotAccount = require("../../models/RiotAccount");
//const game = require("../../../game.json");
//const game = require("../../../game2.json");
const game = require("../../../game3.json");
const ranksFile = require("../../../ranks.json");
const { EmbedBuilder } = require("discord.js");
const { hyperlink, hideLinkEmbed } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("recent").setDescription("Get the statistics of your most recent match."),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        //await interaction.reply(`This is a test command.  Test Test Test.`);
        await interaction.deferReply();

        /*
        const query = {
            userId: interaction.user.id,
        }

        let user;
        try {
            user = await RiotAccount.findOne(query);
            if (user) {
                console.log("User found.  Checking match history.")
                // find user

                
                await interaction.editReply(``);
            } else {
                console.log("User not in database.")
                await interaction.editReply(`You are not logged in.  Please use the /login command to log in.`);
                return;
            }
        } catch (error) {
            console.log("Error finding user in database.")
            return;
        }
        */
        let user = {};
        user.riotName = "Player 4";
        user.riotTag = "0000";

        let redPlayers = [];
        let bluePlayers = [];
        let players = [];
        let author;

        let ranks = JSON.parse(JSON.stringify(ranksFile));

        let playerNamePlaceholders = [
            "Player 1",
            "Player 2",
            "Player 3",
            "Player 4",
            "Player 5",
            "Player 6",
            "Player 7",
            "Player 8",
            "Player 9",
            "Player 10",
        ];
        // get players from the game
        for (let i = 0; i < game.players.length; i++) {
            let player = {};
            player.name = playerNamePlaceholders[i];
            player.tag = "0000";
            player.isAuthor = `${playerNamePlaceholders[i]}#0000` === `${user.riotName}#${user.riotTag}`;
            player.kills = game.players[i].stats.kills;
            player.deaths = game.players[i].stats.deaths;
            player.assists = game.players[i].stats.assists;
            player.acs = Math.round(game.players[i].stats.score / game.players[i].stats.roundsPlayed);
            player.acsStatus =
                Math.round(game.players[i].stats.score / game.players[i].stats.roundsPlayed) >= 300 ? " :fire:" : "";
            player.score = game.players[i].stats.score;
            player.teamId = game.players[i].teamId;
            player.partyId = game.players[i].partyId;
            player.rank = {
                rankId: game.players[i].competitiveTier,
                rankName:
                    ranks[
                        ranks.findIndex(function (rank) {
                            return rank.id === game.players[i].competitiveTier;
                        })
                    ].name,
                rankIcon:
                    ranks[
                        ranks.findIndex(function (rank) {
                            return rank.id === game.players[i].competitiveTier;
                        })
                    ].emoji,
            };
            player.agent = await fetch(`https://valorant-api.com/v1/agents/${game.players[i].characterId}`)
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
                    let agentInfo = {};
                    agentInfo.name = result.data.displayName;
                    agentInfo.icon = result.data.displayIcon;
                    return agentInfo;
                });

            if (player.isAuthor) {
                author = player;
            }

            if (game.players[i].teamId.toLowerCase() === "red") {
                redPlayers.push(player);
            } else {
                bluePlayers.push(player);
            }
            players.push(player);
        }

        redPlayers.sort((a, b) => b.acs - a.acs);
        bluePlayers.sort((a, b) => b.acs - a.acs);
        players.sort((a, b) => b.acs - a.acs);

        let mapUUID = "d960549e-485c-e861-8d71-aa9d1aed12a2";

        let match = {};
        match.mapId = game.matchInfo.mapId;
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
            new Response(stream, { headers: { "Content-Type": "text/html" } }).text()
        )
        .then((result) => {
            // Do things with result
            result = JSON.parse(result);
            for(let i = 0; i < result.data.length; i++) {
                if (result.data[i].mapUrl === game.matchInfo.mapId) {
                    return result.data[i];
                }
            }
        });
        match.map = map.displayName;
        match.mapimage = map.listViewIcon;
        match.id = game.matchInfo.matchId;
        match.gamemode = game.matchInfo.queueId;
        match.isRanked = game.matchInfo.isRanked;
        match.gameStartTime = game.matchInfo.gameStartMillis;
        match.gameLength = game.matchInfo.gameLengthMillis;
        match.teamScore = author.teamId.toLowerCase() === "red" ? game.teams[0].roundsWon : game.teams[1].roundsWon;
        match.enemyScore = author.teamId.toLowerCase() === "red" ? game.teams[1].roundsWon : game.teams[0].roundsWon;
        if (match.teamScore > match.enemyScore) {
            match.outcome = "Win";
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
        if (match.outcome === "Win") {
            embedInfo.color = colors.green;
        } else if (match.outcome === "Defeat") {
            embedInfo.color = colors.red;
        } else {
            embedInfo.color = colors.yellow;
        }

        const embed = new EmbedBuilder()
            .setColor(embedInfo.color)
            .setAuthor({
                name: `${match.outcome} | ${match.teamScore} - ${match.enemyScore}`,
                iconURL: author.agent.icon,
                url: `https://tracker.gg/valorant/match/${match.id}`,
            })
            .addFields({
                name: "Your Team",
                value: redPlayers
                    .map(
                        (player) =>
                            `${player.rank.rankIcon} ${player.name} [${player.acs}${player.acsStatus}] - ${player.kills}/${player.deaths}/${player.assists}`
                    )
                    .join("\n"),
                inline: false,
            })
            .addFields({
                name: "Enemy Team",
                value: bluePlayers
                    .map(
                        (player) =>
                            `${player.rank.rankIcon} ${player.name} [${player.acs}${player.acsStatus}] - ${player.kills}/${player.deaths}/${player.assists}`
                    )
                    .join("\n"),
                inline: false,
            })
            .addFields({
                name: "Match Info",
                value: `Map: ${match.map}\nGame Start Time: ${new Date(match.gameStartTime).toDateString()}\nGame Length: ${millisToMinutesAndSeconds(match.gameLength)}`,
            })
            .setImage(match.mapimage)

        interaction.editReply({ embeds: [embed] });
    },
};

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }