import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot from react-dom

import App from './App';

const root = document.getElementById('root');

// Use createRoot to render the app
createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
