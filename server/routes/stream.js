const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const EventEmitter = require('events');

// Global event emitter for streaming user-scoped events
const streamEvents = new EventEmitter();
streamEvents.setMaxListeners(500);

// Helper function to dispatch real-time events to a specific user
const sendUserStreamEvent = (userId, data) => {
    if (!userId) return;
    const channel = `user:${userId.toString()}`;
    streamEvents.emit(channel, data);
};

router.streamEvents = streamEvents;
router.sendUserStreamEvent = sendUserStreamEvent;

router.get('/', (req, res) => {
    // Extract token from query param or Authorization header
    let token = req.query.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required for real-time notification stream' });
    }

    let userId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired stream authentication token' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial connected confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

    const userEventChannel = `user:${userId.toString()}`;

    const onUserUpdate = (data) => {
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
            // Connection may have terminated
        }
    };

    streamEvents.on(userEventChannel, onUserUpdate);

    // Keepalive heartbeat ping every 30 seconds
    const pingInterval = setInterval(() => {
        try {
            res.write('data: {"type": "ping"}\n\n');
        } catch (e) {
            clearInterval(pingInterval);
        }
    }, 30000);

    req.on('close', () => {
        streamEvents.removeListener(userEventChannel, onUserUpdate);
        clearInterval(pingInterval);
    });
});

module.exports = router;
