const { Schema, model } = require('mongoose');

const BotStatsSchema = new Schema({
    command: {
        type: String,
        required: true,
    },
    uses: {
        type: Number,
        required: true,
    }
});

module.exports = model('BotStats', BotStatsSchema);