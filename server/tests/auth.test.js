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
});
