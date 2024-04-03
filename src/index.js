const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { token, mongodbUri } = require("../config.json");
const mongoose = require("mongoose");
const BotStats = require("./models/BotStats.cjs");


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        } else {
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }

    // Track command uses in database
    try {
        await BotStats.findOneAndUpdate({command: "all"}, {$inc: {uses: 1}}, {upsert: true});
        let uses = await BotStats.findOne({command: command.data.name});

        if (uses) {
            await BotStats.findOneAndUpdate({command: command.data.name}, {$inc: {uses: 1}}, {upsert: true});
        } else {
            const newCommand = new BotStats({
                command: command.data.name,
                uses: 1,
            });

            await newCommand.save();
        }
    } catch (error) {
        console.log("Error updating command uses in database:\n", error)
    }
});

(async () => {
    try {
        await mongoose.connect(mongodbUri);
        console.log("Connected to MongoDB");
        
        client.login(token);
    } catch (error) {
        console.error(error);
    }
})();

