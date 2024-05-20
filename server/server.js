const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

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

// Import route handlers
const roomsRouter = require('./routes/room');

// Middleware to attach io to the request object
app.use('/api/room', (req, res, next) => {
    req.io = io; // Attach io to the request object
    next();
});

// Use route handlers
app.use('/api/room', roomsRouter);

// User to Socket mapping to track user connections
const userSockets = new Map();

// Handle user disconnection
const handleDisconnect = (socket) => {
    const userId = Array.from(userSockets.entries()).find(([key, value]) => value === socket)?.[0];
    if (userId) {
        userSockets.delete(userId);
        console.log(`User with ID ${userId} disconnected`);
    }
};

io.on('connect', (socket) => {
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

    socket.on('joinRoom', (data) => {
        console.log('Player joined:', data);
        socket.join(data.roomPin);
        io.to(data.roomPin).emit('playerJoined', data);
    });

    socket.on('submitAnswers', (data) => {
        console.log('Answers submitted:', data);
        io.to(data.roomPin).emit('answerSubmitted', data);
    });
});

const PORT = process.env.PORT || 2709;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await mongoose.connect('mongodb+srv://randomhero:azharnurda@cluster0.cw0qz.mongodb.net/adamzat');
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectToMongoDB();
