import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getRoomDetails } from '../services/api';
import socket from '../services/socket';

const Results = () => {
    const { roomPin } = useParams();
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState(null);
    const location = useLocation();
    const playerNickname = location.state?.playerNickname;

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(roomPin, playerNickname);
                // Sort players by overall points in descending order
                const sortedPlayers = details.players.sort((a, b) => b.overallPoints - a.overallPoints);
                setPlayers(sortedPlayers);
            } catch (error) {
                setError('Error fetching room details');
                console.error('Error fetching room details:', error);
            }
        };

        fetchRoomDetails();

        const handlePointsUpdate = ({ players }) => {
            // Sort updated players by overall points in descending order
            const sortedPlayers = players.sort((a, b) => b.overallPoints - a.overallPoints);
            setPlayers(sortedPlayers);
        };

        socket.on('pointsUpdated', handlePointsUpdate);

        return () => {
            socket.off('pointsUpdated', handlePointsUpdate);
        };
    }, [roomPin, playerNickname]);

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
