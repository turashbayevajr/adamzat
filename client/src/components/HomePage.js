// components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div>
            <h1>Welcome to Adamzat</h1>
            <div>
                <Link to="/create-room">
                    <button>Create Room</button>
                </Link>
                <Link to="/join-room">
                    <button>Join Room</button>
                </Link>
            </div>
        </div>
    );
};

export default HomePage;
