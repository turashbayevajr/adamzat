//server/models/room.js
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
    },
});

const roomSchema = new mongoose.Schema({
    pin: {
        type: Number,
        unique: true,
        required: true,
    },
    ownerNickname: {
        type: String,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // rounds: [roundSchema],
});

// Unique index for players.nickname within each room
roomSchema.index({ "players.nickname": 1 }, { unique: true, partialFilterExpression: { "players.nickname": { $exists: true } } });

const Room = mongoose.model('Room', roomSchema);

module.exports = { Room };
