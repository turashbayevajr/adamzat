import axios from 'axios';

const backendUrl = 'http://localhost:2709'; // Updated backend URL

const api = axios.create({
    baseURL: `${backendUrl}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to create a new room and return the room ID
export const createRoom = async (pin, nickname, password, confirmPassword, categories) => {
    try {
        const response = await api.post('/room/create', {
            pin,
            password,
            confirmPassword,
            categories,
            nickname, // Include the owner as a player
        });
        return response.data; // Assuming the server returns { roomId: '...' }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Server error');
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
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response:', error.response.data);
            throw new Error(error.response.data.message || 'Failed to fetch room details');
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
            console.error('Error request:', error.request);
            throw new Error('No response received from the server');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
            throw new Error('An error occurred while making the request');
        }
    }
};

export const submitAnswers = async (roomPin, nickname, answers) => {
    try {
        const response = await api.post(`/room/submit-answers?roomPin=${roomPin}&nickname=${nickname}`, { answers });
        return response.data;
    } catch (error) {
        console.error('Submit Answers Error:', error);
        throw new Error(error.response?.data?.message || 'Server error');
    }
};

export default api;
