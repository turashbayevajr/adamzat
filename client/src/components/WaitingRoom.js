import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import socket from '../services/socket';

const WaitingRoom = () => {
    const [players, setPlayers] = useState([]);
    const [isOwner, setIsOwner] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { roomPin } = useParams();
    const { playerNickname } = location.state;
    const isListenerAdded = useRef(false); // Track if listener is added

    useEffect(() => {
        // Emit joinRoom only once
        socket.emit('joinRoom', { roomPin, nickname: playerNickname });

        if (!isListenerAdded.current) {
            // Listen for player updates
            const handlePlayerJoined = (data) => {
                console.log("Player joined data:", data); // Debugging: log the received data
                setPlayers(data.players || []);
            };
            socket.on('playerJoined', handlePlayerJoined);

            // Listen for game start
            const handleGameStarted = () => {
                navigate(`/gameplay/${roomPin}/1`, { state: { playerNickname } }); // Redirect to the first round
            };
            socket.on('gameStarted', handleGameStarted);

            isListenerAdded.current = true; // Mark listeners as added

            // Cleanup on component unmount
            return () => {
                socket.off('playerJoined', handlePlayerJoined);
                socket.off('gameStarted', handleGameStarted);
                isListenerAdded.current = false; // Mark listeners as removed
            };
        }
    }, [roomPin, playerNickname, navigate]);

    const handleStartGame = () => {
        socket.emit('startGame', { roomPin });
    };

    useEffect(() => {
        // Check if the player is the owner
        if (players.length > 0) {
            setIsOwner(players[0].nickname === playerNickname);
        }
    }, [players, playerNickname]);

    return (
        <div>
            <h2>Waiting Room</h2>
            <h3>Room PIN: {roomPin}</h3>
            <h3>Players:</h3>
            <ul>
                {players.map((player) => (
                    <li
                        key={player.nickname}
                        style={{ color: player.nickname === playerNickname ? 'blue' : 'black' }}
                    >
                        {player.nickname}
                    </li>
                ))}
            </ul>
            {isOwner && <button onClick={handleStartGame}>Start Game</button>}
        </div>
    );
};

export default WaitingRoom;
