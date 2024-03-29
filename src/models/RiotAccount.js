const { Schema, model } = require('mongoose');

const RiotAccountSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    puuid: {
        type: String,
        required: true,
    },
    riotName: {
        type: String,
        required: true,
    },
    riotTag: {
        type: String,
        required: true,
    },
    region: {
        type: String,
        required: true,
    },
});

module.exports = model('RiotAccount', RiotAccountSchema);