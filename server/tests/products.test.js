const request = require('supertest');
const express = require('express');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const Product = require('../models/Product');
const productRoutes = require('../routes/productRoutes');

const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { _id: '5f9f1b9b9b9b9b9b9b9b9b9b' }; // Mock user ID
        next();
    }
}));

app.use('/api/products', require('../routes/productRoutes'));

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Product Endpoints', () => {
    it('should create a new product', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({
                name: 'Test Product',
                sku: 'TEST-001',
                category: 'Test',
                currentPrice: 100,
                baseCost: 80,
                stockLevel: 50,
                reorderThreshold: 20,
                minMargin: 0.1
            });
            
        expect(res.statusCode).toEqual(201);
        expect(res.body.name).toEqual('Test Product');
    });

    it('should get all products for user', async () => {
        await Product.create({
            name: 'Test Product 1',
            sku: 'TEST-001',
            category: 'Test',
            currentPrice: 100,
            baseCost: 80,
            userId: '5f9f1b9b9b9b9b9b9b9b9b9b'
        });

        const res = await request(app).get('/api/products');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.length).toEqual(1);
    });
});
