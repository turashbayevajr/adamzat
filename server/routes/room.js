const express = require('express');
const router = express.Router();
const Room = require('../models/room');

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

        if (room.currentRound > 1) {
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
    const { roomPin, nickname, round, answers } = req.body;

    try {
        const room = await Room.findOne({ pin: parseInt(roomPin) });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const player = room.players.find((p) => p.nickname === nickname);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Save the answers string directly
        player.answers[round - 1] = answers; // Save answers as a single string

        await room.save();

        const io = req.io;
        io.to(roomPin).emit('answersUpdated', { players: room.players });

        res.status(200).json({ message: 'Answers submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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


router.post('/submit-points', async (req, res) => {
    let { roomPin, playerPoints, roundLetter } = req.body;

    if (!playerPoints || typeof playerPoints !== 'object') {
        return res.status(400).json({ message: 'Invalid player points data' });
    }

    try {
        const room = await Room.findOne({ pin: roomPin });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!room.players || room.players.length === 0) {
            return res.status(400).json({ message: 'No players in room' });
        }

        room.players.forEach(player => {
            if (playerPoints[player.nickname] !== undefined) {
                const point = parseInt(playerPoints[player.nickname], 10);
                if (isNaN(point)) {
                    console.error(`Invalid point value for ${player.nickname}: ${playerPoints[player.nickname]}`);
                    throw new Error(`Invalid point value for ${player.nickname}`);
                }
                player.points[room.currentRound - 1] = point; // Save the point for the current round
                player.overallPoints += point; // Update the overall points
            }
        });

        if (!roundLetter) {
            console.warn('Round letter is missing, defaulting to "A"');
            roundLetter = 'A'; // default value if roundLetter is missing
        }

        room.roundResults.push({
            round: room.currentRound,
            letter: roundLetter,
            points: playerPoints // Assuming you want to store the entire object
        });

        await room.save();
        res.status(200).json({ message: 'Points submitted successfully' });
    } catch (error) {
        console.error('Error processing submit-points:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET route to fetch room details
router.get('/gameplay/:roomPin', async (req, res) => {
    const roomPin = parseInt(req.params.roomPin);

    try {
        const room = await Room.findOne({ pin: roomPin });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const randomLetter = room.randomLetters[room.currentRound - 1];
        res.json({
            pin: room.pin,
            players: room.players,
            categories: room.categories,
            currentRound: room.currentRound,
            randomLetter: randomLetter
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
