import axios from 'axios';

const backendUrl = 'http://localhost:2709'; // The URL where your backend server is running

// Create an instance of axios with the base URL and headers set
const api = axios.create({
    baseURL: `${backendUrl}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to create a new room and handle the server response
export const createRoom = async (pin, nickname, password, confirmPassword, categories) => {
    try {
        const response = await api.post('/room/create', {
            pin,
            nickname,
            password,
            confirmPassword,
            categories,
        });
        return response.data; // Return the data from the response
    } catch (error) {
        console.error('Create Room Error:', error);
        throw new Error(error.response?.data?.message || 'Server error');
    }
};

// Function to join an existing room
export const joinRoom = async (pin, password, nickname) => {
    try {
        const response = await api.post('/room/join', {
            pin,
            password,
            nickname,
        });
        return response.data; // Return the data from the response
    } catch (error) {
        console.error('Join Room Error:', error);
        throw new Error(error.response?.data?.message || 'Server error');
    }
};

// Assuming `getRoomDetails` is defined in an API utility file
export const getRoomDetails = async (roomPin, nickname) => {
    try {
        const response = await api.get(`/room/gameplay/${roomPin}/${nickname}`);
        return response.data; // This assumes the server responds with JSON data
    } catch (error) {
        console.error('Error fetching room details:', error);
        throw error; // Handle this in your component to show appropriate feedback
    }
};


export const submitAnswers = async (roomPin, nickname, round, answers) => {
    try {
        const response = await api.post(`/room/submit-answers`, {
            roomPin,
            nickname,
            round,
            answers,
        });
        return response.data;
    } catch (error) {
        console.error('Submit Answers Error:', error);
        if (error.response?.data?.message) {
            throw new Error(`Server error: ${error.response.data.message}`);
        } else {
            throw new Error('An error occurred while submitting answers.');
        }
    }
};

// Function to submit points for a specific round
export const submitPoints = async (roomPin, points, round) => {
    try {
        const response = await api.post(`/room/submit-points`, {
            roomPin,
            round,
            points,
        });
        return response.data;
    } catch (error) {
        console.error('Submit Points Error:', error);
        if (error.response?.data?.message) {
            throw new Error(`Server error: ${error.response.data.message}`);
        } else {
            throw new Error('An error occurred while submitting points.');
        }
    }
};


export const getRoundAnswers = async (roomPin, round) => {
    try {
        const response = await api.get(`/room/answers/${roomPin}/${round}`);
        if (response.status === 200) {
            return response.data.answers; // Ensure this matches the structure that your backend sends
        } else {
            throw new Error('Failed to fetch round answers');
        }
    } catch (error) {
        console.error('Error fetching round answers:', error);
        throw error;
    }
};

export const startGame = async (roomPin) => {
    try {
        const response = await api.post(`/room/start-game`, {
            roomPin,
        });
        return response.data; // Return the data from the response
    } catch (error) {
        console.error('Start Game Error:', error);
        throw new Error(error.response?.data?.message || 'Server error');
    }
};

export default api;
