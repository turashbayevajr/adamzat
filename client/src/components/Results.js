import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRoomDetails } from '../services/api';

const Results = () => {
    const { roomPin } = useParams();
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(roomPin);
                // Sort players by overall points in descending order
                const sortedPlayers = details.players.sort((a, b) => b.overallPoints - a.overallPoints);
                setPlayers(sortedPlayers);
            } catch (error) {
                console.error('Error fetching room details:', error);
            }
        };

        fetchRoomDetails();
    }, [roomPin]);

    return (
        <div>
            <h2>Results</h2>
            <h3>Room PIN: {roomPin}</h3>
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
        </div>
    );
};

export default Results;
