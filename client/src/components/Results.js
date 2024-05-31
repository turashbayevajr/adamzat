import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getRoomDetails } from '../services/api';
import socket from '../services/socket';

const Results = () => {
    const { roomPin } = useParams();
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState(null);
    const location = useLocation();
    const playerNickname = location.state?.playerNickname;

    const fetchAndSortPlayers = useCallback(async () => {
        try {
            const details = await getRoomDetails(roomPin, playerNickname);
            // Sort players by overall points in descending order
            const sortedPlayers = details.players.sort((a, b) => b.overallPoints - a.overallPoints);
            setPlayers(sortedPlayers);
        } catch (error) {
            setError('Error fetching room details');
            console.error('Error fetching room details:', error);
        }
    }, [roomPin, playerNickname]);

    useEffect(() => {
        fetchAndSortPlayers();

        const handlePointsUpdate = (updatedPlayers) => {
            // Sort updated players by overall points in descending order
            const sortedPlayers = updatedPlayers.sort((a, b) => b.overallPoints - a.overallPoints);
            setPlayers(sortedPlayers);
        };

        socket.emit('joinRoom', { roomPin, nickname: playerNickname });

        socket.on('pointsUpdate', handlePointsUpdate);

        return () => {
            socket.off('pointsUpdate', handlePointsUpdate);
        };
    }, [roomPin, playerNickname, fetchAndSortPlayers]);

    return (
        <div>
            <h2>Results</h2>
            <h3>Room PIN: {roomPin}</h3>
            {error ? (
                <div>{error}</div>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Player</th>
                        <th>Overall Points</th>
                    </tr>
                    </thead>
                    <tbody>
                    {players.map(player => (
                        <tr key={player.nickname}>
                            <td>{player.nickname}</td>
                            <td>{player.overallPoints}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Results;
