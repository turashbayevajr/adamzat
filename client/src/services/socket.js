import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:2709'; // Adjust the URL if needed

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
});

export default socket;
