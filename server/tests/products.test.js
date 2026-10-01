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

    it('should return 400 if URL is missing in extract-url', async () => {
        const res = await request(app)
            .post('/api/products/extract-url')
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('required');
    });

    it('should extract metadata and sensible shortName from product URL', async () => {
        const res = await request(app)
            .post('/api/products/extract-url')
            .send({ url: 'https://amzn.in/d/0eBjbC8S' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.fullName).toBeDefined();
        expect(res.body.shortName).toBeDefined();
        // Should contain the product noun (e.g. Refrigerator) and brand, not just truncated star rating
        expect(res.body.shortName.length).toBeGreaterThan(5);
        expect(res.body.shortName).toMatch(/Godrej/i);
    }, 15000);

    it('should clean brand names properly from marketplace titles and stores', () => {
        const { cleanBrandName, generateSensibleShortName } = require('../controllers/productController');
        expect(cleanBrandName('Visit the Godrej Store')).toEqual('Godrej');
        expect(cleanBrandName('Visit the godrej')).toEqual('Godrej');
        expect(cleanBrandName('Godrej Store')).toEqual('Godrej');
        expect(cleanBrandName('Brand: Godrej')).toEqual('Godrej');
        expect(cleanBrandName('The Derma Co')).toEqual('The Derma Co');

        const title = 'Godrej 223 L 3 Star, New Launch with 5 Years Comprehensive Warranty, 6-In-1 Freezer Convertible, 30 Days Farm Freshness, Inverter Double Door Refrigerator (RF EON 244CN RCIF ST RH, Steel Rush)';
        const shortName = generateSensibleShortName(title, 'Visit the Godrej Store');
        expect(shortName).toEqual('Godrej 223 L 3 Star Double Door Refrigerator');
    });
});

