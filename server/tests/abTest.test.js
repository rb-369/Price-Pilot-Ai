const request = require('supertest');
const express = require('express');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const abTestRoutes = require('../routes/abTestRoutes');
const ABTest = require('../models/ABTest');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { _id: '5f9f1b9b9b9b9b9b9b9b9b9b' }; // Mock user ID
        next();
    }
}));

app.use('/api/ab-tests', require('../routes/abTestRoutes'));

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('A/B Test Endpoints', () => {
    let mockProduct;

    beforeEach(async () => {
        mockProduct = await Product.create({
            _id: '5f9f1b9b9b9b9b9b9b9b9b9c',
            name: 'Test Product',
            sku: 'TEST-123',
            category: 'Electronics',
            currentPrice: 100,
            baseCost: 50,
            stockLevel: 10,
            reorderThreshold: 5,
            userId: '5f9f1b9b9b9b9b9b9b9b9b9b'
        });
    });

    it('should create an AB test', async () => {
        const res = await request(app)
            .post('/api/ab-tests')
            .send({
                productId: mockProduct._id,
                variantBPrice: 110
            });
            
        expect(res.statusCode).toEqual(201);
        expect(res.body.variantA.price).toEqual(100);
        expect(res.body.variantB.price).toEqual(110);
        expect(res.body.status).toEqual('active');
    });

    it('should record views and conversions', async () => {
        // Create test
        const testRes = await request(app)
            .post('/api/ab-tests')
            .send({
                productId: mockProduct._id,
                variantBPrice: 110
            });
            
        const testId = testRes.body._id;

        // Record view for A
        await request(app)
            .post(`/api/ab-tests/${testId}/record`)
            .send({ variant: 'A', eventType: 'view' });
            
        // Record conversion for A
        const res = await request(app)
            .post(`/api/ab-tests/${testId}/record`)
            .send({ variant: 'A', eventType: 'conversion' });
            
        expect(res.statusCode).toEqual(200);
        expect(res.body.results.variantA.views).toEqual(1);
        expect(res.body.results.variantA.conversions).toEqual(1);
        expect(res.body.results.variantA.revenue).toEqual(100);
    });
});
