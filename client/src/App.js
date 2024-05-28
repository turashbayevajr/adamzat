import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import WaitingRoom from "./components/WaitingRoom";
import GamePlay from "./components/GamePlay";
import CheckRoom from "./components/CheckRoom";
import Results from "./components/Results"; // Import the new CheckRoom component

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create-room" element={<CreateRoom />} />
                <Route path="/join-room" element={<JoinRoom />} />
                <Route path="/waiting-room/:roomPin" element={<WaitingRoom />} />
                <Route path="/gameplay/:roomPin/:round" element={<GamePlay />} />
                <Route path="/check-room/:roomPin/:round" element={<CheckRoom />} />
                <Route path="/results/:roomPin" element={<Results />} />

            </Routes>
        </Router>
    );
};

export default App;
