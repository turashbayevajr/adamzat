// server/routes/room.js
const express = require('express');
const router = express.Router();
const { Room } = require('../models/room');
// POST route to create a room
router.post('/create', async (req, res) => {
    const { pin, ownerNickname, password, confirmPassword, categories } = req.body;

    if (!pin || !ownerNickname || !password || !confirmPassword || !categories || categories.length !== 5) {
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

        const room = new Room({ pin: parseInt(pin), ownerNickname, password, confirmPassword, categories });
        await room.save();

        res.status(201).json({ message: 'Room created successfully', roomPin: room.pin});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST route to join a room
router.post('/join', async (req, res) => {
    const { pin, nickname, password } = req.body;

    // Validate input data
    if (!pin || !nickname || !password) {
        return res.status(400).json({ message: 'Invalid request data' });
    }

    try {
        // Check if the room exists
        const room = await Room.findOne({ pin });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Validate password
        if (room.password !== password) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Check if nickname is already used in the room or is the same as owner's nickname
        const existingPlayer = room.players.find((player) => player.nickname === nickname);
        if (existingPlayer || room.ownerNickname === nickname) {
            return res.status(400).json({ message: 'Nickname is already in use in this room or is the owner\'s nickname' });
        }

        // Add the player to the room
        room.players.push({ nickname });
        await room.save();
        // // Log room information after player joins
        // console.log('Room information after player joins:', room);

        res.status(200).json({ message: 'Player joined successfully', roomPin: room.pin});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

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
            ownerNickname: room.ownerNickname
        });
    } catch (error) {
        console.error('Error fetching room details:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
});

module.exports = router;
