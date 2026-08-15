const request = require('supertest');
const express = require('express');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Auth Endpoints', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@test.com',
                password: 'password123'
            });
            
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.name).toEqual('Test User');
    });

    it('should not register user with existing email', async () => {
        await User.create({
            name: 'Existing User',
            email: 'test@test.com',
            password: 'password123'
        });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User 2',
                email: 'test@test.com',
                password: 'password123'
            });
            
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/exists/i);
    });

    it('should login valid user', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@test.com',
                password: 'password123'
            });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@test.com',
                password: 'password123'
            });
            
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should complete onboarding and save preferences', async () => {
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Pilot Merchant',
                email: 'pilot@example.com',
                password: 'password123'
            });

        const token = regRes.body.token;

        const res = await request(app)
            .put('/api/auth/onboarding')
            .set('Authorization', `Bearer ${token}`)
            .send({
                channels: ['amazon', 'shopify', 'flipkart'],
                goals: ['profit', 'clear_inventory'],
                pricingStrategy: 'undercut_1',
                automationLevel: 'full_auto',
                catalogSize: '501_2500',
                industryNiche: 'electronics',
                targetMarginFloor: 25,
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.onboarding.completed).toBe(true);
        expect(res.body.onboarding.channels).toContain('amazon');
        expect(res.body.onboarding.goals).toContain('profit');
        expect(res.body.preferences.pricingStrategy).toEqual('undercut_1');
        expect(res.body.preferences.minMarginFloor).toEqual(25);
        expect(res.body.preferences.autoApplyRecommendations).toBe(true);
    });
});
