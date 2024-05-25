import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/api';
import socket from '../services/socket'; // Import the socket instance

const allCategories = [
    'The name of the person',
    'City',
    'Animal',
    'Movie',
    'Celebrity',
    'Actor',
    'Song',
    'Book',
    'Verb',
    'Adjective',
    'Clothing Item',
    'Historical Figure',
    'Literary Work',
    'Body Part',
    'Job Title',
    'Emotion',
];

const CreateRoom = () => {
    const [pin, setPin] = useState('');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Add any event listeners for socket here if needed

        return () => {
            // Clean up event listeners if added
        };
    }, []);

    const handleCheckboxChange = (category) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter((c) => c !== category));
        } else if (selectedCategories.length < 5) {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!pin || !nickname || !password || !confirmPassword || selectedCategories.length !== 5) {
            setErrorMessage('Please fill in all fields and choose exactly 5 categories');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }

        try {
            const data = await createRoom(pin, nickname, password, confirmPassword, selectedCategories);
            setSuccessMessage('Room created successfully');

            socket.emit('createRoom', { roomPin: data.roomPin, nickname });

            navigate(`/waiting-room/${data.roomPin}`, { state: { playerNickname: nickname } });
        } catch (error) {
            setErrorMessage('Error creating room');
            console.error(error.message);
        }
    };

    return (
        <div>
            <h2>Create Room</h2>
            <form onSubmit={handleSubmit}>
                <input type="number" placeholder="Room PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
                <input type="text" placeholder="Your Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {allCategories.map((category) => (
                        <label key={category}>
                            <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => handleCheckboxChange(category)} />
                            {category}
                        </label>
                    ))}
                </div>
                <button type="submit">Create</button>
            </form>
            {errorMessage && <p>{errorMessage}</p>}
            {successMessage && <p>{successMessage}</p>}
        </div>
    );
};

export default CreateRoom;
