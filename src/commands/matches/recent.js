const { SlashCommandBuilder } = require("discord.js");
const { riotApiKey } = require("../../../config.json");
const RiotAccount = require("../../models/RiotAccount.cjs");
const { ranks, agents } = require("../../../game-content.json");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("recent").setDescription("Get the statistics of your most recent match."),
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

        const requestURL = `https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/${user.region}/${user.puuid}?size=1`;
        let game = await fetch(requestURL)
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
                return result.data[0];
            });

        let players = [];
        let author;

        // get players from the game
        for (let i = 0; i < game.players.all_players.length; i++) {
            let player = {};
            player.name = game.players.all_players[i].name;
            player.tag = game.players.all_players[i].tag;
            player.puuid = game.players.all_players[i].puuid;
            player.region = game.metadata.region;
            player.tracker = `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(player.name)}%23${encodeURIComponent(player.tag)}/overview`;
            player.isAuthor =
                `${game.players.all_players[i].name}#${game.players.all_players[i].tag}` ===
                `${user.riotName}#${user.riotTag}`;
            player.kills = game.players.all_players[i].stats.kills;
            player.deaths = game.players.all_players[i].stats.deaths;
            player.assists = game.players.all_players[i].stats.assists;
            player.acs = Math.round(
                game.players.all_players[i].stats.score / game.rounds.length
            );
            player.acsStatus =
                Math.round(game.players.all_players[i].stats.score / game.rounds.length) >= 300 ? " :fire:" : "";
            player.score = game.players.all_players[i].stats.score;
            player.team = game.players.all_players[i].team;
            player.partyId = game.players.all_players[i].partyId;
            player.shots = {
                head: game.players.all_players[i].stats.headshots,
                body: game.players.all_players[i].stats.bodyshots,
                leg: game.players.all_players[i].stats.legshots,
                total: game.players.all_players[i].stats.headshots + game.players.all_players[i].stats.bodyshots + game.players.all_players[i].stats.legshots
            }
            player.headshotpercentage = (player.shots.head / player.shots.total) * 100;
            player.rank = {
                rankId: game.players.all_players[i].competitiveTier,
                rankName:
                    ranks[
                        ranks.findIndex(function (rank) {
                            return rank.id === game.players.all_players[i].currenttier;
                        })
                    ].name,
                rankIcon:
                    ranks[
                        ranks.findIndex(function (rank) {
                            return rank.id === game.players.all_players[i].currenttier;
                        })
                    ].emoji,
            };
            player.agent = {
                agentName: game.players.all_players[i].character,
                agentEmoji:
                    agents[
                        agents.findIndex(function (agent) {
                            return agent.name === game.players.all_players[i].character;
                        })
                    ].emoji,
            };

            if (player.isAuthor) {
                author = player;
            }
            
            players.push(player);
        }

        let teamPlayers = [];
        let enemyPlayers = [];

        for (let i = 0; i < players.length; i++) {
            if (players[i].team.toLowerCase() === author.team.toLowerCase()) {
                teamPlayers.push(players[i]);
            } else {
                enemyPlayers.push(players[i]);
            }
        }

        teamPlayers.sort((a, b) => b.acs - a.acs);
        enemyPlayers.sort((a, b) => b.acs - a.acs);
        players.sort((a, b) => b.acs - a.acs);

        author.mmr = await fetch(`https://api.henrikdev.xyz/valorant/v1/lifetime/mmr-history/${author.region}/${encodeURIComponent(author.name)}/${encodeURIComponent(author.tag)}?size=1`)
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
            return {
                current: result.data[0].ranking_in_tier,
                change: result.data[0].last_mmr_change
            }
        });

        let match = {};
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
                for (let i = 0; i < result.data.length; i++) {
                    if (result.data[i].displayName === game.metadata.map) {
                        return result.data[i];
                    }
                }
            });
        match.map = map.displayName;
        match.mapimage = map.listViewIcon;
        match.id = game.metadata.matchid;
        match.gamemode = game.metadata.mode;
        match.gameStartTime = game.metadata.game_start;
        match.gameLength = game.metadata.game_length;
        match.teamScore = author.team.toLowerCase() === "red" ? game.teams.red.rounds_won : game.teams.blue.rounds_won;
        match.enemyScore = author.team.toLowerCase() === "red" ? game.teams.blue.rounds_won : game.teams.red.rounds_won;
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
                name: "Tracker",
                iconURL: author.agent.icon,
                url: `https://tracker.gg/valorant/match/${match.id}`,
            })
            .setTitle(`${match.outcome} | ${match.teamScore} - ${match.enemyScore}`)
            .addFields({
                name: "Your Team",
                value: teamPlayers
                    .map(
                        (player) =>
                            `${player.rank.rankIcon} ${player.agent.agentEmoji} ${(player.isAuthor) ? "**" : ""} [${player.name + "#" + player.tag}](${player.tracker}) [${player.acs}${player.acsStatus}] - ${player.kills}/${player.deaths}/${player.assists} ${(player.isAuthor) ? "\n| " + author.mmr.change + "RR " + author.rank.rankIcon + author.rank.rankName + " " + author.mmr.current + "RR**"  : ""}`
                    )
                    .join("\n"),
                inline: false,
            })
            .addFields({
                name: "Enemy Team",
                value: enemyPlayers
                    .map(
                        (player) =>
                            `${player.rank.rankIcon} ${player.agent.agentEmoji} ${(player.isAuthor) ? "**" : ""} [${player.name + "#" + player.tag}](${player.tracker}) [${player.acs}${player.acsStatus}] - ${player.kills}/${player.deaths}/${player.assists} ${(player.isAuthor) ? "\n| " + author.mmr.change + "RR " + author.rank.rankIcon + author.rank.rankName + " " + author.mmr.current + "RR**"  : ""}`
                    )
                    .join("\n"),
                inline: false,
            })
            .addFields({
                name: "Player Stats",
                value: `Headshot %: ${author.headshotpercentage.toFixed(2)}%\nRank: ${author.rank.rankIcon} ${author.rank.rankName}\n[View Full Match History](https://tracker.gg/valorant/match/${match.id})`,
                inline: false
            })

            
            .addFields({
                name: "Match Info",
                value: `Map: ${match.map}\nGame Start Time: <t:${
                    match.gameStartTime
                }:F>\nGame Length: ${secondsToMinutesAndSeconds(match.gameLength)}`,
            })
            .setImage(match.mapimage);

        interaction.editReply({ embeds: [embed] });
    },
};

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function secondsToMinutesAndSeconds(sec) {
    var minutes = Math.floor(sec / 60);
    var seconds = sec % 60;
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
