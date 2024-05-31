import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getRoomDetails, submitAnswers } from '../services/api';
import socket from '../services/socket';

const GamePlay = () => {
    const { roomPin, round } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [roomDetails, setRoomDetails] = useState(null);
    const [timer, setTimer] = useState(20);
    const [randomLetter, setRandomLetter] = useState('');
    const [answers, setAnswers] = useState(['', '', '', '', '']); // Array to store answers for each category
    const playerNickname = location.state?.playerNickname;

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(roomPin, playerNickname);
                setRoomDetails(details);
                setRandomLetter(details.randomLetter);
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
    }, [roomPin, round, playerNickname]);

    const handleSubmit = useCallback(async () => {
        try {
            await submitAnswers(roomPin, playerNickname, answers); // Submit answers as an array
            socket.emit('submitAnswers', { roomPin, nickname: playerNickname, answers, randomLetter });
            navigate(`/check-room/${roomPin}/${round}`, { state: { playerNickname, randomLetter } });
        } catch (error) {
            console.error('Error submitting answers:', error);
        }
    }, [answers, playerNickname, roomPin, round, navigate, randomLetter]);

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

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
