const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    nickname: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return value !== null;
            },
            message: 'Nickname must not be null',
        },
        default: null, // Allow null values
    },
    answers: [
        {
            type: String,
        },
    ],
    points: {
        type: Number,
        default: 0,
    },
});
const roomSchema = new mongoose.Schema({
    pin: {
        type: Number,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    confirmPassword: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return this.password === value;
            },
            message: 'Passwords do not match',
        },
    },
    categories: {
        type: [String],
        required: true,
        validate: {
            validator: (value) => value.length === 5,
            message: 'Must choose exactly 5 categories',
        },
    },
    players: [playerSchema], // Array of players with unique nicknames within each room
    currentRound: {
        type: Number,
        default: 1,
    },
    randomLetter: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Unique compound index for "pin" and "players.nickname" within each room
roomSchema.index({ pin: 1, "players.nickname": 1 }, { unique: true, partialFilterExpression: { "players.nickname": { $type: 'string' } } });

const Room = mongoose.model('Room', roomSchema);

module.exports = { Room };
