//client/src/services/api.js
import axios from 'axios';

const backendUrl = 'http://localhost:2709/api'; // Updated backend URL

const api = axios.create({
    baseURL: backendUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to create a new room and return the room ID
export const createRoom = async (pin, ownerNickname, password, confirmPassword, categories) => {
    try {
        const response = await api.post('/room/create', {
            pin,
            ownerNickname,
            password,
            confirmPassword,
            categories,
        });
        const { roomId } = response.data; // Extract room ID from the response
        return roomId;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Server error'); // Improved error handling
    }
};

export const joinRoom = async (pin, password, nickname) => {
    try {
        const response = await api.post('/room/join', { pin, password, nickname });
        console.log('API Response:', response);
        return response.data;
    } catch (error) {
        console.error('Join Room Error:', error);
        throw new Error(error.response?.data?.message || 'Server error');
    }
};

export const getRoomDetails = async (roomId) => {
    try {
        const response = await api.get(`/room/gameplay/${roomId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching room details:', error);
        // Handling specific error responses
        throw new Error(error.response?.data?.message || 'Failed to fetch room details');
    }
};

export default api;
