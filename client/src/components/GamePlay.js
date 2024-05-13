// GamePlay.js
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getRoomDetails } from '../services/api';

const GamePlay = () => {
    const { id } = useParams();
    const location = useLocation();
    const [roomDetails, setRoomDetails] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(id);
                setRoomDetails(details);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchRoomDetails();
    }, [id]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!roomDetails) {
        return <div>Loading room details...</div>;
    }

    const playerNickname = location.state?.playerNickname || '';
    return (
        <div>
            <h1>Game Room: {roomDetails.pin}</h1>
            <h2>Owner: {roomDetails.ownerNickname}</h2>
            <div>
                <h2>Current User: {playerNickname}</h2>
            </div>
        </div>
    );
};

export default GamePlay;