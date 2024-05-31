const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Room = require('./models/room');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },
});

app.use(express.json());
app.use(cors());

const roomsRouter = require('./routes/room');
app.use('/api/room', (req, res, next) => {
    req.io = io; // Attach io to the request object
    next();
});
app.use('/api/room', roomsRouter);

const userSockets = new Map();

const handleDisconnect = (socket) => {
    const userId = Array.from(userSockets.entries()).find(([key, value]) => value === socket)?.[0];
    if (userId) {
        userSockets.delete(userId);
        console.log(`User with ID ${userId} disconnected`);
    }
};

io.on('connection', (socket) => {
    console.log('Connected with id:', socket.id);

    socket.on('userId', (userId) => {
        console.log(`Received userId: ${userId}`);
        if (userSockets.has(userId)) {
            console.log(`User with ID ${userId} already connected. Disconnecting existing socket.`);
            handleDisconnect(userSockets.get(userId)); // Disconnect the existing socket
        }

        userSockets.set(userId, socket);
        console.log(`User with ID ${userId} connected with socket id: ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log(`Socket with id ${socket.id} disconnected`);
        handleDisconnect(socket);
    });

    socket.on('createRoom', (data) => {
        console.log('Room created:', data);
        socket.broadcast.emit('roomCreated', data);
    });

    socket.on('joinRoom', async (data) => {
        console.log(`Player joined: ${data.nickname} in room ${data.roomPin}`);
        socket.join(data.roomPin);
        try {
            const room = await Room.findOne({ pin: data.roomPin });
            if (room) {
                const existingPlayer = room.players.find(player => player.nickname === data.nickname);
                if (!existingPlayer) {
                    room.players.push({ nickname: data.nickname });
                    await room.save();
                }
                const players = room.players;
                io.to(data.roomPin).emit('playerJoined', { players });
            }
        } catch (error) {
            console.error(`Error finding or updating room: ${error}`);
        }
    });

    socket.on('submitAnswers', async (data) => {
        console.log('Answers submitted:', data);
        try {
            const room = await Room.findOne({ pin: data.roomPin });
            if (room) {
                const playerIndex = room.players.findIndex(player => player.nickname === data.nickname);
                if (playerIndex !== -1) {
                    const player = room.players[playerIndex];
                    const currentRound = player.currentRound;

                    // Ensure the player's answers array is initialized and has 5 sub-arrays
                    while (player.answers.length < 5) {
                        player.answers.push([]);
                    }

                    // Update the specific round in the answers array
                    player.answers[currentRound - 1] = data.answers; // Store answers at the correct round index

                    // Mark that the player has submitted for the current round
                    player.hasSubmitted = true;

                    // Check if all players have submitted for the current round
                    const allSubmitted = room.players.every(p => p.currentRound > currentRound || p.hasSubmitted);

                    if (allSubmitted) {
                        // Increment current round for all players who have submitted
                        room.players.forEach(p => {
                            if (p.hasSubmitted) {
                                p.currentRound += 1;
                                p.hasSubmitted = false; // Reset submission status for the next round
                            }
                        });
                    }

                    // Save the room with the updated player answers
                    await room.save(); // Use save() instead of findOneAndUpdate() to avoid version errors

                    io.to(data.roomPin).emit('answersUpdated', { players: room.players });
                }
            }
        } catch (error) {
            console.error(`Error updating answers: ${error}`);
        }
        io.to(data.roomPin).emit('answerSubmitted', data);
    });


    socket.on('startGame', (data) => {
        console.log('Game started:', data);
        io.to(data.roomPin).emit('gameStarted', data);
    });


    socket.on('submitPoints', async (data) => {
        console.log('Points submitted:', data);
        try {
            const room = await Room.findOne({ pin: data.roomPin });
            if (room) {
                const currentRound = room.currentRound;
                const roundPoints = {};

                room.players.forEach(player => {
                    if (data.points[player.nickname] !== undefined) {
                        const point = parseInt(data.points[player.nickname]);
                        player.points.push({ round: currentRound, point });
                        if (!roundPoints[player.nickname]) roundPoints[player.nickname] = 0;
                        roundPoints[player.nickname] += point;
                    }
                });

                room.players.forEach(player => {
                    const playerPoints = player.points.filter(p => p.round === currentRound).map(p => p.point);
                    const averagePoint = playerPoints.reduce((a, b) => a + b, 0) / playerPoints.length;
                    player.overallPoints += Math.round(averagePoint);
                });

                room.roundResults.push({ round: currentRound, letter: room.randomLetters[currentRound - 1], points: roundPoints });
                room.currentRound++;

                await room.save();

                io.to(data.roomPin).emit('pointsUpdated', { players: room.players, currentRound: room.currentRound });

                if (room.currentRound > 5) {
                    io.to(data.roomPin).emit('gameOver', { players: room.players });
                }
            }
        } catch (error) {
            console.error('Error submitting points:', error);
        }
    });

});

const PORT = process.env.PORT || 2709;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

async function connectToMongoDB() {
    try {
        await mongoose.connect('mongodb+srv://randomhero:azharnurda@cluster0.cw0qz.mongodb.net/adamzat');
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectToMongoDB();
