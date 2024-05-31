import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getRoomDetails, getRoundAnswers, submitPoints } from '../services/api';
import socket from '../services/socket';

const CheckRoom = () => {
    const { roomPin, round } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [roomDetails, setRoomDetails] = useState(null);
    const [roundAnswers, setRoundAnswers] = useState([]);
    const [checkedAnswers, setCheckedAnswers] = useState({});
    const [timer, setTimer] = useState(20);
    const playerNickname = location.state?.playerNickname;

    const calculatePoints = useCallback(() => {
        const points = {};
        Object.keys(checkedAnswers).forEach(nickname => {
            points[nickname] = checkedAnswers[nickname].filter(checked => checked).length;
        });
        return points;
    }, [checkedAnswers]);

    const handleSubmitPoints = useCallback(async () => {
        const points = calculatePoints();
        try {
            await submitPoints(roomPin, points, round);
            const nextRound = parseInt(round) + 1;
            if (nextRound > 5) {
                navigate(`/results/${roomPin}`,  { state: { playerNickname } }); // Navigate to results page after the fifth round
            } else {
                navigate(`/gameplay/${roomPin}/${nextRound}`, { state: { playerNickname } }); // Navigate to next round
            }
        } catch (error) {
            console.error('Error submitting points:', error);
        }
    }, [roomPin, round, calculatePoints, navigate, playerNickname]);

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(roomPin, playerNickname);
                setRoomDetails(details);
            } catch (error) {
                console.error('Error fetching room details:', error);
            }
        };

        const fetchAnswers = async () => {
            try {
                const answers = await getRoundAnswers(roomPin, round);
                setRoundAnswers(answers);
                initializeCheckedAnswers(answers);
            } catch (error) {
                console.error('Error fetching round answers:', error);
            }
        };

        fetchRoomDetails();
        fetchAnswers();

        socket.on('newAnswer', (answer) => {
            updateAnswers(answer);
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
            clearInterval(timerInterval);
        };
    }, [roomPin, round, handleSubmitPoints, playerNickname]);

    const initializeCheckedAnswers = (answers) => {
        setCheckedAnswers(prev => {
            if (Object.keys(prev).length === 0) { // Only initialize if checkedAnswers is empty
                const initialChecked = {};
                answers.forEach(answer => {
                    if (Array.isArray(answer.answers)) {
                        initialChecked[answer.nickname] = answer.answers.map(() => false);
                    }
                });
                return initialChecked;
            }
            return prev;
        });
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

    const handleCheckboxChange = useCallback((nickname, index) => {
        setCheckedAnswers(prev => {
            const newChecked = { ...prev };
            if (!newChecked[nickname]) {
                newChecked[nickname] = [];
            }
            newChecked[nickname] = [...newChecked[nickname]];
            newChecked[nickname][index] = !newChecked[nickname][index];
            return newChecked;
        });
    }, []);

    if (!roomDetails) {
        return <div>Loading room details...</div>;
    }

    return (
        <div>
            <h1>Game Room: {roomDetails.pin}</h1>
            <h2>Round Number: {round}</h2>
            <h2>Round Letter: {location.state?.randomLetter}</h2>
            <h2>Current User: {playerNickname}</h2>
            <h2>Categories:</h2>
            {roomDetails.categories.map((category, index) => (
                <div key={index}>{category}</div>
            ))}

            <table>
                <thead>
                <tr>
                    <th>User</th>
                    <th>Answer</th>
                </tr>
                </thead>
                <tbody>
                {roundAnswers.map((answer, index) => (
                    <tr key={index}>
                        <td>{answer.nickname}</td>
                        <td>
                            {Array.isArray(answer.answers) ? answer.answers.map((word, wordIndex) => (
                                <div key={wordIndex}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={checkedAnswers[answer.nickname]?.[wordIndex] || false}
                                            onChange={() => handleCheckboxChange(answer.nickname, wordIndex)}
                                        />
                                        {word}
                                    </label>
                                </div>
                            )) : 'No answers'}
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
