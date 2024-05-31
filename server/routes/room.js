const express = require('express');
const router = express.Router();
const Room = require('../models/room');
const mongoose = require('mongoose');

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
            return res.status(400).json({ message: 'PIN already used' });
        }

        const room = new Room({
            pin: parseInt(pin),
            password,
            confirmPassword,
            categories,
            players: [{ nickname }],
            currentRound: 1,
        });

        await room.save();

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
            return res.status(404).json({ message: 'PIN does not exist' });
        }

        if (room.password !== password) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const existingPlayer = room.players.find((player) => player.nickname === nickname);
        if (existingPlayer) {
            return res.status(400).json({ message: 'Nickname already used in this room' });
        }

        const gameStarted = room.players.some(player => player.currentRound > 1);
        if (gameStarted) {
            return res.status(400).json({ message: 'Game in this room already started' });
        }
        room.players.push({ nickname });
        await room.save();

        const io = req.io;
        io.to(pin).emit('playerJoined', { players: room.players });

        res.status(200).json({ message: 'Player joined successfully', roomPin: room.pin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/submit-answers', async (req, res) => {
    const { roomPin, nickname, answers } = req.body;

    try {
        const room = await Room.findOne({ pin: parseInt(roomPin) });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const playerIndex = room.players.findIndex((p) => p.nickname === nickname);
        if (playerIndex === -1) {
            return res.status(404).json({ message: 'Player not found' });
        }

        const player = room.players[playerIndex];
        const currentRound = player.currentRound;

        // Ensure the player's answers array is initialized and has 5 sub-arrays
        while (player.answers.length < 5) {
            player.answers.push([]);
        }

        // Update the specific round in the answers array
        player.answers[currentRound] = answers; // Store answers at the correct round index

        // Mark that the player has submitted for the current round
        player.hasSubmitted = true;

        // Save the room with the updated player answers
        room.players[playerIndex] = player;

        await room.save();

        const io = req.io;
        io.to(roomPin).emit('answersUpdated', { players: room.players });

        res.status(200).json({ message: 'Answers submitted successfully', room });
    } catch (error) {
        if (error instanceof mongoose.Error.VersionError) {
            res.status(409).json({ message: 'Concurrent modification detected. Please refresh and try again.' });
        } else {
            console.error('Error submitting answers:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
});
router.post('/submit-points', async (req, res) => {
    const { roomPin, points } = req.body;

    try {
        let room = await Room.findOne({ pin: parseInt(roomPin) });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        room.players.forEach(player => {
            if (points[player.nickname] !== undefined) {
                const currentRound = player.currentRound;

                // Ensure the player's points array is initialized and has the correct length
                while (player.points.length < currentRound) {
                    player.points.push(0);
                }
                player.points[currentRound] = points[player.nickname];
                player.overallPoints += points[player.nickname];
            }
        });

        await room.save();

        const io = req.io;
        io.to(roomPin).emit('pointsUpdated', { players: room.players });

        res.status(200).json({ message: 'Points submitted successfully', room });
    } catch (error) {
        if (error instanceof mongoose.Error.VersionError) {
            res.status(409).json({ message: 'Concurrent modification detected. Please refresh and try again.' });
        } else {
            console.error('Error submitting points:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
});


router.get('/answers/:roomPin/:round', async (req, res) => {
    const { roomPin, round } = req.params;
    try {
        const room = await Room.findOne({ pin: roomPin });
        if (!room) {
            return res.status(404).send('Room not found');
        }

        const answers = room.players.map(player => {
            return {
                nickname: player.nickname,
                answers: player.answers[round - 1], // Assuming answers are stored per round
                points: player.points[round - 1] // Assuming points are stored per round
            };
        });
        res.json({ answers });
    } catch (error) {
        console.error('Failed to fetch answers', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/gameplay/:roomPin/:nickname', async (req, res) => {
    const roomPin = parseInt(req.params.roomPin);
    const { nickname } = req.params;

    try {
        const room = await Room.findOne({ pin: roomPin });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const player = room.players.find(p => p.nickname === nickname);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        const randomLetter = room.randomLetters[player.currentRound - 1];

        res.json({
            pin: room.pin,
            players: room.players,
            categories: room.categories,
            randomLetter: randomLetter,
            currentRound: player.currentRound
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

        req.io.to(roomPin).emit('gameStarted');

        res.status(200).json({ message: 'Game started successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
