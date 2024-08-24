const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const pino = require('pino')();
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');
const http = require('http');
let fetch;
import('node-fetch').then(mod => {
    fetch = mod.default;
});

// Create an HTTP agent for connection pooling
const agent = new http.Agent({ keepAlive: true });

const app = express();
const port = 3000;
const frontendURL = process.env.REACT_APP_FRONTEND_BASE_URL || 'http://localhost:3000';
const backendURL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://backend:8080';

// Middleware for JSON parsing
app.use(express.json());

// Enable gzip compression for responses
app.use(compression());

// Set various HTTP headers for security
app.use(helmet());

// Set up Pino for structured logging using pino-http
app.use(pinoHttp({ logger: pino }));

// Enable CORS with specific configuration for the API routes
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Apply rate limiting to API routes to prevent abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Serve static files with caching enabled
app.use(express.static(path.join(__dirname, 'build'), {
    maxAge: '1y',
    etag: false,
}));

// Health check endpoint for container monitoring
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// API endpoint to handle user login from the AuthForm component
app.post('/api/login', async (req, res) => {
    const { email_address, url } = req.body;

    if (!email_address) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    try {
        const response = await fetch(`${backendURL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email_address, url: frontendURL }),
            agent,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data from the external server');
        }

        pino.info(`Sent email to ${email_address} with URL: ${url}`);
        res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        pino.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to update user data
app.post('/api/user', async (req, res) => {
    const { secret, user } = req.body;

    try {
        const response = await fetch(`${backendURL}/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret, user }),
            agent,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data from the external server');
        }

        pino.info('User profile updated successfully');
        res.json({ success: true, message: 'User profile updated successfully' });
    } catch (error) {
        pino.error('Error updating user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to fetch user data
app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const response = await fetch(`${backendURL}/user/${id}`, { agent });

        if (!response.ok) {
            throw new Error('Error fetching data from external server');
        }

        const data = await response.json();
        pino.info('Successfully fetched data from external server');
        res.json(data);
    } catch (error) {
        pino.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to trigger notifications
app.post('/api/trigger', async (req, res) => {
    const { secret } = req.body;

    try {
        const response = await fetch(`${backendURL}/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret }),
            agent,
        });

        if (!response.ok) {
            throw new Error('Error triggering notifications on the external server');
        }

        pino.info('Notifications triggered successfully');
        res.status(200).json({ success: true, message: 'Notifications triggered successfully' });
    } catch (error) {
        pino.error('Error triggering notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to track clicks
app.get('/api/click', async (req, res) => {
    const { tracking_id, destination } = req.query;

    if (!tracking_id || !destination) {
        return res.status(400).json({ error: 'tracking_id and destination are required' });
    }

    try {
        fetch(`${backendURL}/click?tracking_id=${encodeURIComponent(tracking_id)}&destination=${encodeURIComponent(destination)}`, { agent })
            .then(response => {
                if (!response.ok) {
                    pino.warn('Failed to track click on external server');
                }
            })
            .catch(error => {
                pino.error('Error during click tracking:', error);
            });

        return res.redirect(destination);
    } catch (error) {
        pino.error('Error processing click:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Catch-all handler to serve the React frontend for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(port, () => {
    pino.info(`Server is running on http://localhost:${port}`);
});
