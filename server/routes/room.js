const express = require('express');
const router = express.Router();
const Room = require('../models/room'); // Correctly import the Room model

// POST route to create a room
router.post('/create', async (req, res) => {
    const { pin, nickname, password, confirmPassword, categories } = req.body;

    if (!pin || !nickname || !password || !confirmPassword || !categories || categories.length !== 5) {
        return res.status(400).json({ message: 'Invalid request data' });
    }

    try {
        if (isNaN(parseInt(pin))) {
            return res.status(400).json({ message: 'Invalid PIN format' });
        }

        const existingRoom = await Room.findOne({ pin: parseInt(pin) });
        if (existingRoom) {
            return res.status(400).json({ message: 'PIN is already in use' });
        }

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomIndex = Math.floor(Math.random() * letters.length);
        const randomLetter = letters[randomIndex];

        const room = new Room({
            pin: parseInt(pin),
            password,
            confirmPassword,
            categories,
            players: [{ nickname }],
            currentRound: 1,
            randomLetter,
        });

        await room.save();

        // Access io from the request object
        const io = req.io;
        io.emit('roomCreated', { roomPin: room.pin, players: room.players });

        res.status(201).json({ message: 'Room created successfully', roomPin: room.pin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST route to join a room
router.post('/join', async (req, res) => {
    const { pin, nickname, password } = req.body;

    if (!pin || !nickname || !password) {
        return res.status(400).json({ message: 'Invalid request data' });
    }

    try {
        const room = await Room.findOne({ pin });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.password !== password) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const existingPlayer = room.players.find((player) => player.nickname === nickname);
        if (existingPlayer) {
            return res.status(400).json({ message: 'Nickname is already in use in this room' });
        }

        room.players.push({ nickname });
        await room.save();

        // Access io from the request object
        const io = req.io;
        io.to(pin).emit('playerJoined', { players: room.players });

        res.status(200).json({ message: 'Player joined successfully', roomPin: room.pin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET route to fetch room details
router.get('/gameplay/:id', async (req, res) => {
    const roomPin = req.params.id;

    try {
        const room = await Room.findOne({ pin: roomPin });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json({
            pin: room.pin,
            players: room.players,
            categories: room.categories,
            currentRound: room.currentRound,
            randomLetter: room.randomLetter,
        });
    } catch (error) {
        console.error('Error fetching room details:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
});

// POST route to start the game
router.post('/start-game', async (req, res) => {
    const { roomPin } = req.body;

    try {
        const room = await Room.findOne({ pin: roomPin });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Notify all players that the game has started
        req.io.to(roomPin).emit('gameStarted');

        res.status(200).json({ message: 'Game started successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST route to submit answers
router.post('/submit-answers', async (req, res) => {
    const { answers } = req.body;
    const { roomPin, nickname } = req.query;

    try {
        const room = await Room.findOne({ pin: parseInt(roomPin) });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const player = room.players.find((p) => p.nickname === nickname);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Retry mechanism for handling VersionError
        try {
            player.answers.push(answers);
            await room.save();
        } catch (error) {
            if (error.name === 'VersionError') {
                const updatedRoom = await Room.findById(room._id);
                const updatedPlayer = updatedRoom.players.find((p) => p.nickname === nickname);
                updatedPlayer.answers.push(answers);
                await updatedRoom.save();
            } else {
                throw error;
            }
        }

        // Access io from the request object
        const io = req.io;
        io.to(roomPin).emit('answerSubmitted', { nickname, answers });

        res.status(200).json({ message: 'Answers submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
