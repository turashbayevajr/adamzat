import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRoomDetails } from '../services/api'; // Ensure this path is correct

const GamePlay = () => {
    const { id } = useParams();
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

    return (
        <div>
            <h1>Game Room: {roomDetails.pin}</h1>
            <h2>Owner: {roomDetails.ownerNickname}</h2>
            <div>Players: {roomDetails.players.map(player => player.nickname).join(', ')}</div>
            <div>Categories: {roomDetails.categories.join(', ')}</div>
        </div>
    );
};

export default GamePlay;
