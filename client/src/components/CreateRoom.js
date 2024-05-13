import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/api';

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
    const [ownerNickname, setOwnerNickname] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleCheckboxChange = (category) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter((c) => c !== category));
        } else if (selectedCategories.length < 5) {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (!pin || !ownerNickname || !password || !confirmPassword || selectedCategories.length !== 5) {
            setErrorMessage('Please fill in all fields and choose exactly 5 categories');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }

        try {
            const data = await createRoom(pin, ownerNickname, password, confirmPassword, selectedCategories);
            setSuccessMessage('Room created successfully');
            // Redirect to the gameplay page with the room ID
            navigate(`/gameplay/${data.roomPin}`, { state: { playerNickname: ownerNickname } });
        } catch (error) {
            console.error(error.message); // Handle error
        }
    };

    return (
        <div>
            <h2>Create Room</h2>
            <form onSubmit={handleSubmit}>
                <input type="number" placeholder="Room PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
                <input type="text" placeholder="Your Nickname" value={ownerNickname} onChange={(e) => setOwnerNickname(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {allCategories.slice(0, 6).map((category) => (
                        <label key={category}>
                            <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => handleCheckboxChange(category)} />
                            {category}
                        </label>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {allCategories.slice(6, 12).map((category) => (
                        <label key={category}>
                            <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => handleCheckboxChange(category)} />
                            {category}
                        </label>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {allCategories.slice(12).map((category) => (
                        <label key={category}>
                            <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => handleCheckboxChange(category)} />
                            {category}
                        </label>
                    ))}
                </div>
                <button type="submit">Create</button>
            </form>
            {errorMessage && <p>{errorMessage}</p>}
            {successMessage && <p>{successMessage}</p>} {/* Display success message */}
        </div>
    );
};

export default CreateRoom;
