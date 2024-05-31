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
        default: null,
    },
    answers: {
        type: [[String]], // Nested array to handle multiple rounds
        default: [[], [], [], [], []], // Initialize with 5 empty sub-arrays
    },
    points: [
        {
            type: Number,
        },
    ],
    overallPoints: {
        type: Number,
        default: 0,
    },
    currentRound: {
        type: Number,
        default: 1,
    },
    hasSubmitted: {
        type: Boolean,
        default: false,
    },
});



const roomSchema = new mongoose.Schema({
    pin: {
        type: Number,
        unique: true,
        required: true,
        validate: {
            validator: function(value) {
                return !isNaN(value);
            },
            message: 'Pin must be a valid number'
        }
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
    players: [playerSchema],
    randomLetters: {
        type: [String],
        default: () => {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const randomLetters = new Set();
            while (randomLetters.size < 5) {
                const randomIndex = Math.floor(Math.random() * letters.length);
                randomLetters.add(letters[randomIndex]);
            }
            return Array.from(randomLetters);
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
roomSchema.index({ pin: 1, "players.nickname": 1 }, { unique: true, partialFilterExpression: { "players.nickname": { $type: 'string' } } });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
