const request = require('supertest');
const express = require('express');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const feedbackRoutes = require('../routes/feedbackRoutes');
const reportRoutes = require('../routes/reportRoutes');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Mock auth middleware for testing
const mockAuth = (req, res, next) => {
    req.user = { id: '60d0fe4f5311236168a109ca', email: 'test@example.com' };
    next();
};

app.use('/api/feedback', mockAuth, feedbackRoutes);
app.use('/api/reports', mockAuth, reportRoutes);

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Feedback & Report Endpoints', () => {
    it('should submit platform feedback successfully', async () => {
        const res = await request(app)
            .post('/api/feedback')
            .send({
                rating: 5,
                category: 'feature_request',
                comment: 'PricePilot dynamic simulator is exceptional!'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.rating).toEqual(5);
        expect(res.body.data.comment).toEqual('PricePilot dynamic simulator is exceptional!');
    });

    it('should reject feedback without required fields', async () => {
        const res = await request(app)
            .post('/api/feedback')
            .send({
                category: 'feature_request'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
    });

    it('should submit an issue report successfully', async () => {
        const res = await request(app)
            .post('/api/reports')
            .send({
                title: 'Competitor scraping lag on SKU-101',
                description: 'Competitor price was delayed by 5 minutes',
                type: 'bug',
                severity: 'medium',
                pageUrl: '/dashboard/competitors'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toEqual('Competitor scraping lag on SKU-101');
    });

    it('should reject report without title or description', async () => {
        const res = await request(app)
            .post('/api/reports')
            .send({
                type: 'bug'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
    });
});
