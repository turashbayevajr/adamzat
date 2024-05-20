import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getRoomDetails, submitAnswers } from '../services/api';
import socket from '../services/socket'; // Import the socket instance

const GamePlay = () => {
    const { id } = useParams();
    const [roomDetails, setRoomDetails] = useState(null);
    const location = useLocation();
    const [timer, setTimer] = useState(60); // 60 seconds = 1 minute
    const [randomLetter, setRandomLetter] = useState('');
    const [answers, setAnswers] = useState(['', '', '', '', '']);
    const [playerNickname, setPlayerNickname] = useState('');
    const [currentRound, setCurrentRound] = useState(1); // Initialize round number to 1

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(id);
                setRoomDetails(details);
                setPlayerNickname(location.state?.playerNickname || '');
                setCurrentRound(details.currentRound);
                setRandomLetter(details.randomLetter);
            } catch (error) {
                console.error(error);
            }
        };

        fetchRoomDetails();

        socket.on('answerSubmitted', (data) => {
            console.log('Answer submitted:', data);
        });

        return () => {
            socket.off('answerSubmitted');
        };
    }, [id, location.state]);

    const handleSubmit = useCallback(async () => {
        const answerString = answers.join(',');

        try {
            await submitAnswers(roomDetails?.pin, playerNickname, answerString);
            socket.emit('submitAnswers', { roomPin: roomDetails?.pin, nickname: playerNickname, answers: answerString }); // Emit the event
        } catch (error) {
            console.error(error);
        }
    }, [answers, playerNickname, roomDetails?.pin]);

    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer((prevTimer) => prevTimer - 1);
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
            <h3>Round Number: {currentRound}</h3>
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
