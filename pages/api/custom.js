import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import pino from 'pino';
import fetch from 'node-fetch';
import http from 'http';
import { promisify } from 'util';

const logger = pino();
const agent = new http.Agent({ keepAlive: true });

const corsOptions = {
    origin: [`http://localhost:3000`],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

const corsMiddleware = promisify(cors(corsOptions));
const compressionMiddleware = promisify(compression());
const helmetMiddleware = promisify(helmet());

export default async function handler(req, res) {
    try {
        // Apply middleware
        await corsMiddleware(req, res);
        await compressionMiddleware(req, res);
        await helmetMiddleware(req, res);

        const { method, url, body } = req;
        const frontendURL = process.env.REACT_APP_FRONTEND_BASE_URL || `http://localhost:3000`;
        const backendURL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://backend:8080';

        if (url.startsWith('/api/health') && method === 'GET') {
            return res.status(200).json({ status: 'OK' });
        } else if (url.startsWith('/api/login') && method === 'POST') {
            const { email_address } = body;

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

                logger.info(`Sent email to ${email_address}`);
                res.status(200).json({ success: true, message: 'Email sent successfully' });
            } catch (error) {
                logger.error('Error during login:', error);
                res.status(500).json({ error: 'Internal server error' });
            }

        } else if (url.startsWith('/api/user') && method === 'POST') {
            const { secret, user } = body;

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

                logger.info('User profile updated successfully');
                res.json({ success: true, message: 'User profile updated successfully' });
            } catch (error) {
                logger.error('Error updating user data:', error);
                res.status(500).json({ error: 'Internal server error' });
            }

        } else if (url.startsWith('/api/user/') && method === 'GET') {
            const id = url.split('/api/user/')[1];

            try {
                const response = await fetch(`${backendURL}/user/${id}`, { agent });

                if (response.status === 404) {
                    return res.status(404).json({ error: 'Login token not found' });
                }
                if (!response.ok) {
                    const e = 'Error fetching login token';
                    logger.error(e);
                    return res.status(500).json({ error: e });
                }

                const data = await response.json();
                logger.info('Successfully fetched data from external server');
                return res.json(data);
            } catch (error) {
                logger.error('Error fetching user data:', error);
                res.status(500).json({ error: 'Internal server error' });
            }

        } else if (url.startsWith('/api/trigger') && method === 'POST') {
            const { secret } = body;

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

                logger.info('Notifications triggered successfully');
                res.status(200).json({ success: true, message: 'Notifications triggered successfully' });
            } catch (error) {
                logger.error('Error triggering notifications:', error);
                res.status(500).json({ error: 'Internal server error' });
            }

        } else if (url.startsWith('/api/click') && method === 'GET') {
            const { tracking_id, destination } = req.query;

            if (!tracking_id || !destination) {
                return res.status(400).json({ error: 'tracking_id and destination are required' });
            }

            const attemptFetch = async (retry = false) => {
                try {
                    const response = await fetch(`${backendURL}/click?tracking_id=${encodeURIComponent(tracking_id)}&destination=${encodeURIComponent(destination)}`, { agent });
                    if (!response.ok) {
                        logger.warn('Failed to track click on external server');
                        if (!retry) {
                            logger.info('Retrying fetch...');
                            return attemptFetch(true); // Retry once if the first attempt fails
                        }
                    }
                } catch (error) {
                    logger.error('Error during click tracking:', error);
                    if (!retry) {
                        logger.info('Retrying fetch after error...');
                        return attemptFetch(true); // Retry once if an error occurs
                    }
                }
            };

            // Fire-and-forget fetch request with retry logic
            void attemptFetch();

            try {
                return res.redirect(destination);
            } catch (error) {
                logger.error('Error processing click:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) {
        logger.error('Middleware processing error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
