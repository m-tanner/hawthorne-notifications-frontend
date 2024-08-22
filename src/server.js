const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;
const backendURL = process.env.REACT_APP_BACKEND_BASE_URL;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes, with more specific configuration for the API routes
app.use(cors({
    origin: ['http://localhost:3000'], // Allow requests from the React frontend running on port 3000
    methods: 'GET,POST,PUT,DELETE', // Allow these methods
    allowedHeaders: 'Content-Type,Authorization', // Allow these headers
    credentials: true, // Allow cookies and other credentials
}));

// Serve the React frontend
app.use(express.static(path.join(__dirname, 'build')));

// API endpoint to handle user login from the AuthForm component
app.post('/api/login', async (req, res) => {
    const {email_address, url} = req.body;

    if (!email_address) {
        return res.status(400).json({error: 'Email address is required'});
    }
    if (!url) {
        return res.status(400).json({error: 'URL is required'});
    }

    const response = await fetch(`${backendURL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({email_address, url}),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch data from the external server');
    }

    console.log(`Sent email to ${email_address} with URL: ${url}`);
    res.status(200).json({success: true, message: 'Email sent successfully'});
});

// API endpoint to update user data
app.post('/api/user', async (req, res) => {
    const {secret, user} = req.body;

    const response = await fetch(`${backendURL}/user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({secret, user}),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch data from the external server');
    }

    console.log('User profile updated successfully');
    res.json({success: true, message: 'User profile updated successfully'});
});

// API endpoint to fetch user data
app.get('/api/user/:id', async (req, res) => {
    const {id} = req.params;
    try {
        const response = await fetch(`${backendURL}/user/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data from the external server');
        }
        const data = await response.json();

        // Send the data back to the client
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// New API endpoint to trigger notifications
app.post('/api/trigger', async (req, res) => {
    try {
        const response = await fetch(`${backendURL}/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
        if (!response.ok) {
            throw new Error('Failed to trigger notifications on the external server');
        }

        console.log('Notifications triggered successfully');
        res.status(200).json({success: true, message: 'Notifications triggered successfully'});
    } catch (error) {
        console.error('Error triggering notifications:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Catch-all handler to serve the React frontend for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
