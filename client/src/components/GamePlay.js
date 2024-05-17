import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getRoomDetails, submitAnswers } from '../services/api';

const GamePlay = () => {
    const { id } = useParams();
    const [roomDetails, setRoomDetails] = useState(null);
    const location = useLocation();
    const [timer, setTimer] = useState(60); // 60 seconds = 1 minute
    const [randomLetter, setRandomLetter] = useState('');
    const [answer1, setAnswer1] = useState('');
    const [answer2, setAnswer2] = useState('');
    const [answer3, setAnswer3] = useState('');
    const [answer4, setAnswer4] = useState('');
    const [answer5, setAnswer5] = useState('');
    const [playerNickname, setPlayerNickname] = useState('');
    const [currentRound, setCurrentRound] = useState(1); // Initialize round number to 1

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const details = await getRoomDetails(id);
                setRoomDetails(details);
                setPlayerNickname(location.state?.playerNickname || '');
                setCurrentRound(details.currentRound); // Update current round from server response
                setRandomLetter(details.randomLetter); // Update random letter from server response
            } catch (error) {
                console.error(error);
            }
        };

        fetchRoomDetails();
    }, [id, location.state]);

    useEffect(() => {
        const handleSubmit = async () => {
            const answers = [answer1, answer2, answer3, answer4, answer5];
            const answerString = answers.join(',');

            try {
                await submitAnswers(roomDetails?.pin, playerNickname, answerString);
                // Handle successful submission
            } catch (error) {
                console.error(error);
                // Handle error
            }
        };

        const countdown = setInterval(() => {
            setTimer((prevTimer) => prevTimer - 1);
        }, 1000);

        if (timer === 0) {
            clearInterval(countdown);
            handleSubmit();
        }

        return () => clearInterval(countdown);
    }, [answer1, answer2, answer3, answer4, answer5, timer, playerNickname, roomDetails]);

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
                            value={index === 0 ? answer1 : index === 1 ? answer2 : index === 2 ? answer3 : index === 3 ? answer4 : answer5}
                            onChange={(e) => {
                                if (index === 0) setAnswer1(e.target.value);
                                else if (index === 1) setAnswer2(e.target.value);
                                else if (index === 2) setAnswer3(e.target.value);
                                else if (index === 3) setAnswer4(e.target.value);
                                else setAnswer5(e.target.value);
                            }}
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
