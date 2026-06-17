const express = require('express');
const router = express.Router();
const EventEmitter = require('events');

// Create a global event emitter for SSE
const streamEvents = new EventEmitter();

// Export it so other routes/services can emit events
// e.g. streamEvents.emit('update', { type: 'recommendation', data: ... })
router.streamEvents = streamEvents;

// Simulate real-time events for demonstration purposes
setInterval(() => {
    const events = [
        { type: 'alert', message: 'Competitor dropped price by 15% on Wireless Earbuds!' },
        { type: 'recommendation', message: 'New AI Pricing Recommendation generated for Smart Watch.' },
        { type: 'demand', message: 'Demand signal spiked for Running Shoes due to upcoming marathon.' }
    ];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    streamEvents.emit('update', randomEvent);
}, 45000); // every 45s

router.get('/', (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send an initial connected message
    res.write('data: {"type": "connected"}\n\n');

    const onUpdate = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    streamEvents.on('update', onUpdate);

    // Ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
        res.write('data: {"type": "ping"}\n\n');
    }, 30000);

    req.on('close', () => {
        streamEvents.removeListener('update', onUpdate);
        clearInterval(pingInterval);
    });
});

module.exports = router;
