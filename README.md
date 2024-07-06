# Ruby: Your Valorant Stats Companion

Ruby is a Discord bot that brings your Valorant match statistics right into your server. Track your recent performance, see your wins and losses, and stay on top of your Valorant game.

## Features

* **Recent Match Summary:** Quickly view your most recent Valorant match details with `/recent`.
* **Match History:** Get a snapshot of your last 5 matches using `/matches`.
* **Secure Login:**  Safeguard your Valorant account by connecting it using `/login username tag`.

## Example Command Outputs

`/recent`|  `/matches`
:-------------------------:|:-------------------------:
![rsz_6688e5a5ee29c](https://github.com/condyl/ruby-discord-bot/assets/108146005/4799d422-8d77-4f5c-ab1a-2233cb8e6260)  |  ![rsz_6688e5f94673a](https://github.com/condyl/ruby-discord-bot/assets/108146005/04c61daa-5528-4748-bc39-3e3c7e05c789)

## Getting Started

1. **Prerequisites:**
   * Node.js and npm (or yarn) installed
   * A Discord bot token (from the Discord Developer Portal)
   * A Henrik Valorant API key (from [HenrikDev Systems Discord](https://discord.gg/henrikdev-systems-704231681309278228))
   * A MongoDB database (free tier on MongoDB Atlas is sufficient)

2. **Installation:**

   ```bash
   git clone https://github.com/condyl/ruby-discord-bot.git
   cd ruby
   npm install
   ```

3. **Configuration:**
    
   * Copy `config.example.json` to `config.json`.
   * Fill in the required values in `config.json`:
      * `token`: Your Discord bot token
      * `clientId`: Your Discord bot's client ID
      * `guildId`: (Optional) Your development server's ID for testing
      * `HenrikApiKey`: Your Henrik Valorant API key
      * `mongodbUri`: Your MongoDB connection string 

4. **Running Ruby:**

   ```bash
   npm start    # Basic start
   nodemon      # For development (restarts on changes)
   ```

5. **Invite Ruby to Your Server:**

   * Generate an invite link in the Discord Developer Portal

## Usage

1. **Link Your Valorant Account:**
   ```
   /login username tag // username#tag
   ```
2. **View Your Recent Match:**
   ```
   /recent
   ```
3. **See Your Match History:**
   ```
   /matches
   ```

## Notes

Since this bot utilizes an unofficial Riot Games API, it can stop working at anytime.  You can see the API Status [here](https://status.henrikdev.xyz/).
