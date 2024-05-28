import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getRoomDetails, getRoundAnswers, submitPoints } from '../services/api';
import socket from '../services/socket';

const CheckRoom = () => {
    const { roomPin, round } = useParams();
    const location = useLocation();
    const [roomDetails, setRoomDetails] = useState(null);
    const [roundAnswers, setRoundAnswers] = useState([]);
    const [points, setPoints] = useState({});
    const [timer, setTimer] = useState(20);
    const playerNickname = location.state?.playerNickname; // Retrieve playerNickname from location state

    const handleSubmitPoints = useCallback(async () => {
        try {
            await submitPoints(roomPin, points, round);
            socket.emit('submitPoints', { roomPin, points, round });
            alert('Points submitted successfully!');
        } catch (error) {
            console.error('Error submitting points:', error);
            alert('Failed to submit points.');
        }
    }, [roomPin, points, round]);

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(roomPin);
                setRoomDetails(details);
            } catch (error) {
                console.error('Error fetching room details:', error);
            }
        };

        const fetchAnswers = async () => {
            try {
                const answers = await getRoundAnswers(roomPin, round);
                setRoundAnswers(answers);
                initializePoints(answers);
            } catch (error) {
                console.error('Error fetching round answers:', error);
            }
        };

        fetchRoomDetails();
        fetchAnswers();

        socket.on('newAnswer', (answer) => {
            updateAnswers(answer);
        });

        socket.on('pointsUpdated', (playerPoints) => {
            setPoints(playerPoints);
        });

        const timerInterval = setInterval(() => {
            setTimer(prevTimer => {
                if (prevTimer > 0) {
                    return prevTimer - 1;
                } else {
                    clearInterval(timerInterval);
                    handleSubmitPoints();
                    return 0;
                }
            });
        }, 1000);

        return () => {
            socket.off('newAnswer');
            socket.off('pointsUpdated');
            clearInterval(timerInterval);
        };
    }, [roomPin, round, handleSubmitPoints]);

    const initializePoints = (answers) => {
        const initialPoints = {};
        answers.forEach(answer => {
            initialPoints[answer.nickname] = 0;
        });
        setPoints(initialPoints);
    };

    const updateAnswers = (newAnswer) => {
        setRoundAnswers(prevAnswers => {
            const existingIndex = prevAnswers.findIndex(ans => ans.nickname === newAnswer.nickname);
            if (existingIndex !== -1) {
                const updatedAnswers = [...prevAnswers];
                updatedAnswers[existingIndex] = newAnswer;
                return updatedAnswers;
            } else {
                return [...prevAnswers, newAnswer];
            }
        });
    };

    // const handlePointsChange = (nickname, newPoints) => {
    //     // Check if newPoints is a valid number
    //     const value = newPoints === '' ? '' : parseInt(newPoints);
    //     if (!isNaN(value) || value === '') {
    //         setPoints(prev => ({ ...prev, [nickname]: value }));
    //     }
    // };

    if (!roomDetails) {
        return <div>Loading room details...</div>;
    }

    return (
        <div>
            <h1>Game Room: {roomDetails.pin}</h1>
            <h2>Round Number: {round}</h2>
            <h2>Round Letter: {location.state?.randomLetter}</h2>
            <h2>Current User: {playerNickname}</h2> {/* Display current username */}
            <h2>Categories:</h2>
            {roomDetails.categories.map((category, index) => (
                <div key={index}>{category}</div>
            ))}

            <table>
                <thead>
                <tr>
                    <th>User</th>
                    <th>Answer</th>
                    <th>Points</th>
                </tr>
                </thead>
                <tbody>
                {roundAnswers.map((answer, index) => (
                    <tr key={index}>
                        <td>{answer.nickname}</td>
                        <td>{answer.answers}</td>
                        <td>
                            <input
                                type="text"
                                pattern="[0-5]*"
                                value={points[answer.nickname] !== undefined ? points[answer.nickname] : ''}
                            />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div>
                <h3>Timer: {timer} seconds</h3>
            </div>
        </div>
    );
};

export default CheckRoom;
