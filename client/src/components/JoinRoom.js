import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../services/api';
import socket from '../services/socket'; // Import the socket instance

const JoinRoom = () => {
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Add any event listeners for socket here if needed

        return () => {
            // Clean up event listeners if added
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = await joinRoom(pin, password, nickname);
            if (data && data.roomPin) {
                setMessage('Player joined successfully');

                // Emit 'joinRoom' event to the server using the centralized socket instance
                socket.emit('joinRoom', { roomPin: data.roomPin, nickname });

                navigate(`/gameplay/${data.roomPin}`, { state: { playerNickname: nickname } });
            } else {
                setMessage('Unexpected response from server');
            }
        } catch (error) {
            setMessage('Error joining room');
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Join Room</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Room PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <input type="text" placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                <button type="submit">Join</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default JoinRoom;
