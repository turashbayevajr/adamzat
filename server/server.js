//server/server.js
const express = require('express');
const app = express();
const cors = require('cors');
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


app.use(express.json());
app.use(cors());
// Import route handlers
const roomsRouter = require('./routes/room');
const gameplayRouter = require('./routes/gameplay');

async function connectToMongoDB() {
    try {
        await mongoose.connect('mongodb+srv://randomhero:azharnurda@cluster0.cw0qz.mongodb.net/adamzat');
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectToMongoDB();

const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("MongoDB connection established"));



// Use route handlers
app.use('/api/room', roomsRouter);
// app.use('/api/gameplay', gameplayRouter);

// Socket.io setup
io.on('connection', (socket) => {
    console.log('A user connected');
    // add socket.io event listeners and handlers here
});

httpServer.listen(2709, () => {
    console.log(`Server running on port 2709`);
});
