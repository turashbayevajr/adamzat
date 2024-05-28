import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getRoomDetails, submitAnswers } from '../services/api';
import socket from '../services/socket';

const GamePlay = () => {
    const { roomPin, round } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [roomDetails, setRoomDetails] = useState(null);
    const [timer, setTimer] = useState(20); // 60 seconds = 1 minute
    const [randomLetter, setRandomLetter] = useState('');
    const [answers, setAnswers] = useState(['', '', '', '', '']);
    const playerNickname = location.state?.playerNickname; // Directly use from location state

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(roomPin);
                console.log('Received details:', details); // Log the details received from the server

                // Check the integrity and completeness of each required field
                const hasValidCategories = Array.isArray(details.categories) && details.categories.length === 5;
                const hasValidCurrentRound = typeof details.currentRound === 'number';
                const hasValidPlayers = Array.isArray(details.players);
                const hasValidRandomLetter = typeof details.randomLetter === 'string' && details.randomLetter.trim() !== '';
                const hasValidPin = typeof details.pin === 'number';

                // Log the status of each validation
                console.log('Validation Status:', {
                    hasValidCategories,
                    hasValidCurrentRound,
                    hasValidPlayers,
                    hasValidRandomLetter,
                    hasValidPin
                });

                if (hasValidCategories && hasValidCurrentRound && hasValidPlayers && hasValidRandomLetter && hasValidPin) {
                    setRoomDetails(details);
                    setRandomLetter(details.randomLetter);
                } else {
                    throw new Error('Invalid or incomplete data received from server');
                }
            } catch (error) {
                console.error('Error fetching room details:', error);
            }
        };

        fetchRoomDetails();

        socket.on('answerSubmitted', (data) => {
            console.log('Answer submitted:', data);
        });

        return () => {
            socket.off('answerSubmitted');
        };
    }, [roomPin, round]);

    const handleSubmit = useCallback(async () => {
        try {
            const answersString = answers.join(','); // Join answers into a single string
            await submitAnswers(roomDetails?.pin, playerNickname, round, answersString, randomLetter);
            socket.emit('submitAnswers', { roomPin: roomDetails?.pin, nickname: playerNickname, round: parseInt(round), answers: answersString, randomLetter });
            navigate(`/check-room/${roomDetails?.pin}/${round}`, { state: { playerNickname, randomLetter } }); // Pass randomLetter in the state
        } catch (error) {
            console.error('Error submitting answers:', error);
        }
    }, [answers, playerNickname, roomDetails, round, randomLetter, navigate]);


    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer(prevTimer => prevTimer - 1);
        }, 1000);

        if (timer === 0) {
            clearInterval(countdown);
            handleSubmit();
        }

        return () => clearInterval(countdown);
    }, [timer, handleSubmit]);

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    if (!roomDetails) {
        return <div>Loading room details...</div>;
    }

    return (
        <div>
            <h1>Game Room: {roomDetails.pin}</h1>
            <h3>Round Number: {round}</h3>
            <h3>Random Letter: {randomLetter}</h3>
            <h3>Current User: {playerNickname}</h3>

            <div>
                <h3>Categories:</h3>
                {roomDetails.categories.map((category, index) => (
                    <div key={index}>
                        <label>{category}</label>
                        <input
                            type="text"
                            placeholder={`Enter word`}
                            value={answers[index]}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                        />
                    </div>
                ))}
            </div>
            <div>
                <h3>Timer: {timer} seconds</h3>
            </div>
        </div>
    );
};
export default GamePlay;
