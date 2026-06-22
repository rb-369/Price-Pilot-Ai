const request = require('supertest');
const express = require('express');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const Product = require('../models/Product');
const PricingRecommendation = require('../models/PricingRecommendation');
const aiRoutes = require('../routes/aiRoutes');

// Mock axios
jest.mock('axios', () => ({
    post: jest.fn().mockResolvedValue({
        data: {
            recommendedPrice: 110,
            reason: "Test reason",
            revenueImpact: 5.5,
            confidenceScore: 0.85
        }
    })
}));

const app = express();
app.use(express.json());

jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { _id: '5f9f1b9b9b9b9b9b9b9b9b9b' };
        next();
    }
}));

app.use('/api/ai', require('../routes/aiRoutes'));

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('AI Controller Endpoints', () => {
    let mockProduct;

    beforeEach(async () => {
        mockProduct = await Product.create({
            name: 'AI Test Product',
            sku: 'AI-001',
            category: 'Electronics',
            currentPrice: 100,
            baseCost: 80,
            userId: '5f9f1b9b9b9b9b9b9b9b9b9b'
        });
    });

    it('should generate recommendations', async () => {
        const res = await request(app).post(`/api/ai/recommendations/${mockProduct._id}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('queued');
        expect(res.body.jobId).toBeDefined();
    });

    it('should accept recommendation', async () => {
        const rec = await PricingRecommendation.create({
            productId: mockProduct._id,
            recommendedPrice: 120,
            reason: 'Test',
            revenueImpact: 10,
            confidenceScore: 0.9,
            status: 'pending'
        });

        const res = await request(app)
            .put(`/api/ai/recommendations/${rec._id}/accept`);
            
        expect(res.statusCode).toEqual(200);
        expect(res.body.recommendation.status).toEqual('accepted');
        
        // Verify product price updated
        const updatedProduct = await Product.findById(mockProduct._id);
        expect(updatedProduct.currentPrice).toEqual(120);
    });
});
