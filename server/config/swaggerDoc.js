/**
 * PricePilot AI — OpenAPI 3.0.3 Specification
 * Defines all 18+ endpoints, schemas, tags, and security definitions.
 */

const swaggerDocument = {
    openapi: "3.0.3",
    info: {
        title: "PricePilot AI — Dynamic Pricing & Multi-Channel Intelligence API",
        version: "1.0.0",
        description: "Production-grade RESTful API for multi-channel e-commerce dynamic pricing, real-time competitor tracking, demand forecasting, Explainable AI (XAI), and multi-agent copilot services.",
        contact: {
            name: "PricePilot AI Engineering Team",
            url: "https://price-pilot-ai-369.vercel.app"
        },
        license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT"
        }
    },
    servers: [
        {
            url: "https://price-pilot-ai.onrender.com",
            description: "Production Backend Server (Render)"
        },
        {
            url: "http://localhost:5000",
            description: "Local Development Server"
        }
    ],
    tags: [
        { name: "Authentication", description: "Merchant registration, JWT login, OAuth, and profile management" },
        { name: "Products", description: "Catalog management, SKU tracking, cost price, and stock synchronization" },
        { name: "Dynamic Pricing & AI", description: "Price recommendations, revenue impact optimization, accept/reject workflows, and XAI" },
        { name: "Demand Forecasting", description: "Time-series forecasting, Prophet trend decomposition, and stockout risk analysis" },
        { name: "Competitor Intelligence", description: "Real-time Amazon and Flipkart scraper integration and price trend tracking" },
        { name: "AI Chatbot & Copilot", description: "Conversational RAG agent, /what-if simulator, and natural language explanations" },
        { name: "A/B Testing Simulator", description: "Multi-armed bandit traffic allocation and statistical conversion rate testing" },
        { name: "Multi-Channel Integrations", description: "Shopify Admin API, Amazon SP-API, and Flipkart Seller Hub synchronization" },
        { name: "Sales & Analytics", description: "Historical sales aggregation, margin distribution, and 30-day chart telemetry" },
        { name: "System & Health", description: "Kubernetes/Render liveness, readiness, and diagnostic health probes" }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Enter your JWT Bearer token obtained from `/api/auth/login`"
            }
        },
        schemas: {
            User: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66ae1f92b42f1b0012a99e81" },
                    name: { type: "string", example: "Rudra Seller" },
                    email: { type: "string", example: "rb1@gmail.com" },
                    storeType: { type: "string", enum: ["shopify", "amazon", "flipkart", "woocommerce", "other"], example: "shopify" },
                    createdAt: { type: "string", format: "date-time" }
                }
            },
            Product: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66ae2014b42f1b0012a99e90" },
                    name: { type: "string", example: "RB Moistureizer 100ml" },
                    sku: { type: "string", example: "RB-SKIN-001" },
                    category: { type: "string", example: "Beauty & Personal Care" },
                    baseCost: { type: "number", example: 120.0 },
                    currentPrice: { type: "number", example: 249.0 },
                    minMargin: { type: "number", example: 0.25 },
                    stockLevel: { type: "integer", example: 145 },
                    reorderThreshold: { type: "integer", example: 25 },
                    salesVelocity: { type: "number", example: 4.2 }
                }
            },
            PricingRecommendation: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "66ae21a0b42f1b0012a99fa2" },
                    productId: { $ref: "#/components/schemas/Product" },
                    recommendedPrice: { type: "number", example: 279.0 },
                    expectedRevenueImpact: { type: "number", example: 14.5 },
                    confidenceScore: { type: "number", example: 0.92 },
                    elasticityUsed: { type: "number", example: -1.35 },
                    status: { type: "string", enum: ["pending", "accepted", "rejected", "reverted"], example: "pending" },
                    reason: { type: "string", example: "Competitor out of stock on Amazon. High search trend justifies 12% price increase." },
                    factors: {
                        type: "object",
                        properties: {
                            competitorFactor: { type: "number", example: 34.0 },
                            demandFactor: { type: "number", example: 22.5 },
                            stockFactor: { type: "number", example: 15.0 }
                        }
                    }
                }
            },
            Forecast: {
                type: "object",
                properties: {
                    productId: { type: "string", example: "66ae2014b42f1b0012a99e90" },
                    predictedDailyDemand: { type: "number", example: 6.8 },
                    daysUntilStockout: { type: "integer", example: 21 },
                    forecastDays: { type: "integer", example: 30 },
                    forecastCurve: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                date: { type: "string", example: "2026-09-10" },
                                demand: { type: "number", example: 7.2 },
                                lowerBound: { type: "number", example: 5.9 },
                                upperBound: { type: "number", example: 8.5 }
                            }
                        }
                    }
                }
            },
            ApiError: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Resource not found or unauthorized" },
                    error: { type: "string", example: "Detailed exception description" }
                }
            }
        }
    },
    paths: {
        "/api/health": {
            get: {
                tags: ["System & Health"],
                summary: "Health Check Probe",
                description: "Returns uptime, server environment, and basic liveness status.",
                responses: {
                    200: {
                        description: "Service is online and responsive.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "ok" },
                                        uptime: { type: "number", example: 84321.4 },
                                        environment: { type: "string", example: "production" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/ready": {
            get: {
                tags: ["System & Health"],
                summary: "Readiness Probe",
                description: "Verifies MongoDB connection state before routing traffic.",
                responses: {
                    200: { description: "Database connected and ready." },
                    503: { description: "Database unavailable." }
                }
            }
        },
        "/api/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "Register New Merchant Account",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "email", "password"],
                                properties: {
                                    name: { type: "string", example: "Rudra Seller" },
                                    email: { type: "string", example: "seller@store.com" },
                                    password: { type: "string", example: "securePassword123" },
                                    storeType: { type: "string", example: "shopify" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "User registered successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                                        user: { $ref: "#/components/schemas/User" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Validation error or email already exists." }
                }
            }
        },
        "/api/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Merchant Login",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string", example: "rb1@gmail.com" },
                                    password: { type: "string", example: "12345678" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Authentication successful, returns JWT token.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                                        user: { $ref: "#/components/schemas/User" }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: "Invalid credentials." }
                }
            }
        },
        "/api/products": {
            get: {
                tags: ["Products"],
                summary: "List Store Products",
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
                    { name: "search", in: "query", schema: { type: "string" } }
                ],
                responses: {
                    200: {
                        description: "Paginated list of catalog products.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                                        total: { type: "integer", example: 27 },
                                        page: { type: "integer", example: 1 }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["Products"],
                summary: "Create / Ingest New Product",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Product" }
                        }
                    }
                },
                responses: {
                    201: { description: "Product created successfully." }
                }
            }
        },
        "/api/ai/recommendations": {
            get: {
                tags: ["Dynamic Pricing & AI"],
                summary: "Get Dynamic Pricing Recommendations",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: "List of pending and past pricing recommendations.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { type: "array", items: { $ref: "#/components/schemas/PricingRecommendation" } },
                                        total: { type: "integer", example: 12 }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/ai/recommendations/{id}/accept": {
            post: {
                tags: ["Dynamic Pricing & AI"],
                summary: "Accept Pricing Recommendation",
                description: "Applies the new price to the local catalog and automatically syncs with connected Shopify/Amazon stores.",
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    200: { description: "Price updated and synced successfully." }
                }
            }
        },
        "/api/ai/recommendations/{id}/reject": {
            post: {
                tags: ["Dynamic Pricing & AI"],
                summary: "Reject Pricing Recommendation",
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } }
                ],
                responses: {
                    200: { description: "Recommendation rejected and logged for ML retraining." }
                }
            }
        },
        "/api/ai/dashboard-stats": {
            get: {
                tags: ["Dynamic Pricing & AI"],
                summary: "Get Executive Dashboard KPIs & XAI",
                description: "Returns aggregated revenue impact, inventory valuation, active alert counts, and Explainable AI (XAI) feature impact factors.",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: "Dashboard metrics and XAI factors payload."
                    }
                }
            }
        },
        "/api/ai/chart-data": {
            get: {
                tags: ["Sales & Analytics"],
                summary: "Get 30-Day Aggregated Demand & Competitor Trends",
                security: [{ BearerAuth: [] }],
                parameters: [
                    { name: "days", in: "query", schema: { type: "integer", default: 30 } }
                ],
                responses: {
                    200: { description: "Time-series daily data points for Recharts visualization." }
                }
            }
        },
        "/api/chats/message": {
            post: {
                tags: ["AI Chatbot & Copilot"],
                summary: "Interact with Conversational Pricing Copilot",
                description: "Processes user queries, @product context mentions, and slash commands (/what-if, /explain-simply).",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["messages"],
                                properties: {
                                    messages: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                role: { type: "string", enum: ["user", "assistant"] },
                                                content: { type: "string", example: "/what-if i change price of @RB Moistureizer to 240rs" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "AI copilot response with structured What-If action payload." }
                }
            }
        },
        "/api/ab-tests": {
            get: {
                tags: ["A/B Testing Simulator"],
                summary: "List Active Price A/B Experiments",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "List of running and completed Thompson Sampling experiments." }
                }
            },
            post: {
                tags: ["A/B Testing Simulator"],
                summary: "Launch New Price A/B Test",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["productId", "priceA", "priceB"],
                                properties: {
                                    productId: { type: "string" },
                                    priceA: { type: "number", example: 249.0 },
                                    priceB: { type: "number", example: 279.0 },
                                    durationDays: { type: "integer", default: 14 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "A/B test initialized." }
                }
            }
        },
        "/api/competitor-prices": {
            get: {
                tags: ["Competitor Intelligence"],
                summary: "Get Real-time Competitor Prices",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "List of tracked competitor prices from Amazon and Flipkart." }
                }
            }
        },
        "/api/integrations": {
            get: {
                tags: ["Multi-Channel Integrations"],
                summary: "Get Connected Store Integrations",
                security: [{ BearerAuth: [] }],
                responses: {
                    200: { description: "Connection status for Shopify, Amazon SP-API, and Flipkart." }
                }
            }
        }
    }
};

module.exports = swaggerDocument;
