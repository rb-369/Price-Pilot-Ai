// ─── Mock external services BEFORE any requires ───
jest.mock('ioredis', () => {
    const fakeRedis = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        setex: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(),
        disconnect: jest.fn().mockResolvedValue(),
        status: 'ready',
    };
    return jest.fn(() => fakeRedis);
});

jest.mock('bullmq', () => {
    const fakeQueue = {
        add: jest.fn().mockResolvedValue({ id: 'test-job-1' }),
        getJob: jest.fn().mockResolvedValue(null),
        on: jest.fn(),
    };
    return {
        Queue: jest.fn(() => fakeQueue),
        Worker: jest.fn(() => ({ on: jest.fn() })),
    };
});

jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({ text: 'mock parsed pdf text' }));

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const Product = require('../models/Product');
const Chat = require('../models/Chat');
const chatRoutes = require('../routes/chatRoutes');

let mockUser = { _id: new mongoose.Types.ObjectId() };

jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = mockUser;
        next();
    }
}));

const app = express();
app.use(express.json());
app.use('/api/chats', chatRoutes);

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Chat Memory and Catalog Isolation', () => {
    let userAId;
    let userBId;

    beforeEach(async () => {
        userAId = new mongoose.Types.ObjectId();
        userBId = new mongoose.Types.ObjectId();

        // User A has 20 products
        const userAProducts = [];
        for (let i = 1; i <= 20; i++) {
            userAProducts.push({
                name: `User A Product ${i}`,
                sku: `SKU-A-${i}`,
                category: 'Electronics',
                currentPrice: 100 + i * 10,
                baseCost: 50 + i * 5,
                userId: userAId,
                stockLevel: 100
            });
        }
        await Product.insertMany(userAProducts);
    });

    it('should NOT leak User A products to a new User B who has 0 products', async () => {
        // Set authenticated user to User B (a brand new user with 0 products)
        mockUser = { _id: userBId };

        // 1. Create a new chat for User B
        const createRes = await request(app)
            .post('/api/chats')
            .send({ title: 'New Chat' });
        
        expect(createRes.statusCode).toEqual(201);
        const chatId = createRes.body._id;

        // 2. User B asks how many products they have
        const msgRes = await request(app)
            .post(`/api/chats/${chatId}/message`)
            .send({ message: 'how many products do i have?' });

        expect(msgRes.statusCode).toEqual(200);
        const reply = msgRes.body.reply.content;

        // Must explicitly state 0 products, NOT 20 products!
        expect(reply).toContain('0 products');
        expect(reply).not.toContain('20 active products');
        expect(reply).not.toContain('User A Product');
    });

    it('should isolate chat history between User A and User B', async () => {
        // User A creates a chat
        mockUser = { _id: userAId };
        const chatARes = await request(app)
            .post('/api/chats')
            .send({ title: "User A's Private Strategy" });
        const chatAId = chatARes.body._id;

        // User B tries to view or message User A's chat
        mockUser = { _id: userBId };
        const getRes = await request(app).get(`/api/chats/${chatAId}`);
        expect(getRes.statusCode).toEqual(404);

        const sendRes = await request(app)
            .post(`/api/chats/${chatAId}/message`)
            .send({ message: 'Can I see your products?' });
        expect(sendRes.statusCode).toEqual(404);

        // User B's getChats list should be empty
        const listRes = await request(app).get('/api/chats');
        expect(listRes.statusCode).toEqual(200);
        expect(listRes.body.length).toEqual(0);
    });

    it('should correctly report products for User A who has products', async () => {
        mockUser = { _id: userAId };
        const createRes = await request(app)
            .post('/api/chats')
            .send({ title: 'Catalog Check' });
        const chatId = createRes.body._id;

        const msgRes = await request(app)
            .post(`/api/chats/${chatId}/message`)
            .send({ message: 'how many products do i have?' });

        expect(msgRes.statusCode).toEqual(200);
        const reply = msgRes.body.reply.content;
        expect(reply).toContain('20 active products');
    });

    it('should calculate direct What-If analysis with action payload when /what-if query is sent', async () => {
        mockUser = { _id: userAId };
        const createRes = await request(app)
            .post('/api/chats')
            .send({ title: 'What-If Test' });
        const chatId = createRes.body._id;

        const msgRes = await request(app)
            .post(`/api/chats/${chatId}/message`)
            .send({ message: '/what-if @"User A Product 1" to 250rs' });

        expect(msgRes.statusCode).toEqual(200);
        const reply = msgRes.body.reply.content;
        expect(reply).toContain('What-If Analysis: User A Product 1');
        expect(reply).toContain('Current Price:');
        expect(reply).toContain('New Price:');
        expect(reply).toContain('Overall Verdict:');
        expect(reply).toContain('---ACTION_REDIRECT_WHAT_IF---');
        expect(reply).toMatch(/"action"\s*:\s*"redirect_what_if"/);
    });
});
