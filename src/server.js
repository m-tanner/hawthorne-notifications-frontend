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
const frontendURL = process.env.REACT_APP_FRONTEND_BASE_URL || `http://localhost:${port}`;
const backendURL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://backend:8080';

// allow express-rate-limit to accurately identify users
app.set('trust proxy', 1);

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
    origin: [`http://localhost:${port}`],
    methods: ['GET', 'POST'],
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
            body: JSON.stringify({ email_address, url: `${frontendURL}/user-profile/` }),
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

    const response = await fetch(`${backendURL}/user/${id}`, { agent });

    if (response.status === 404) {
        return res.status(404).json({ error: 'Login token not found' });
    }
    if (!response.ok) {
        const e = 'Error fetching login token'
        pino.error(e);
        return res.status(500).json({ error: e });
    }

    const data = await response.json();
    pino.info('Successfully fetched data from external server');
    return res.json(data);
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
app.get('/api/click', (req, res) => {
    const { tracking_id, destination } = req.query;

    if (!tracking_id || !destination) {
        return res.status(400).json({ error: 'tracking_id and destination are required' });
    }

    const attemptFetch = async (retry = false) => {
        try {
            const response = await fetch(`${backendURL}/click?tracking_id=${encodeURIComponent(tracking_id)}&destination=${encodeURIComponent(destination)}`, { agent });
            if (!response.ok) {
                pino.warn('Failed to track click on external server');
                if (!retry) {
                    pino.info('Retrying fetch...');
                    return attemptFetch(true); // Retry once if the first attempt fails
                }
            }
        } catch (error) {
            pino.error('Error during click tracking:', error);
            if (!retry) {
                pino.info('Retrying fetch after error...');
                return attemptFetch(true); // Retry once if an error occurs
            }
        }
    };

    // Fire-and-forget fetch request with retry logic
    void attemptFetch();

    try {
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
