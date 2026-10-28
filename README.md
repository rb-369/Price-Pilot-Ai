<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="client/src/assets/new_dark_logo.png" />
    <source media="(prefers-color-scheme: light)" srcset="client/src/assets/new_light_logo.png" />
    <img src="client/src/assets/new_dark_logo.png" alt="PricePilot AI Logo" width="240" />
  </picture>
</p>

<h1 align="center">🚀 PricePilot AI — Dynamic Pricing & Inventory Intelligence Platform</h1>

<p align="center">
  <strong>An autonomous, multi-channel e-commerce pricing optimization and inventory intelligence platform powered by LangGraph multi-agent swarms, Bayesian price elasticity modeling, Prophet time-series forecasting, and conversational RAG copilots.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=flat-square&logo=vite" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4.x-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js" alt="Node.js 20" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/LangGraph-Multi--Agent-FF6B6B?style=flat-square" alt="LangGraph" />
  <img src="https://img.shields.io/badge/LangChain-RAG-1C3C3C?style=flat-square&logo=langchain" alt="LangChain" />
  <img src="https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat-square&logo=google" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/OpenRouter-Nemotron%2070B-6366F1?style=flat-square" alt="OpenRouter" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6F00?style=flat-square" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" alt="Docker" />
</p>

---

## 📋 Academic Project Information

| Field | Details |
|-------|---------|
| **Course Name** | Project |
| **Course Code** | PRO230812 |
| **Department** | CSE (Computer Science and Engineering) |
| **Semester** | V |
| **Topic** | PricePilot AI – Dynamic Pricing and Inventory Intelligence Platform |
| **Academic Year** | 2025–2026 |
| **Institution** | Final Year Project |

### 👥 Team Members

| Name | Roll No. | Role & Contribution |
|------|----------|---------------------|
| **Rudra Babar** | B002 | Architecture, AI Microservices, LangGraph Agents, Backend APIs, Evaluation Harness |
| **Aryan Desale** | B010 | Full-Stack Engineering, Frontend UI/UX, Stacking Card Animations, Design Systems |

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Multi-Agent & RAG Workflows](#-multi-agent--rag-workflows)
- [Architecture & System Design Diagrams (10 Complete Diagrams)](#-architecture--system-design-diagrams-10-complete-diagrams)
  - [1. Overall System Architecture Diagram](#1-overall-system-architecture-diagram)
  - [2. System Block Diagram](#2-system-block-diagram)
  - [3. Main System Workflow Flowchart](#3-main-system-workflow-flowchart)
  - [4. Use Case Diagram](#4-use-case-diagram)
  - [5. Data Flow Diagram (DFD)](#5-data-flow-diagram-dfd)
  - [6. Competitor Intelligence Agent Workflow](#6-competitor-intelligence-agent-workflow)
  - [7. AI Pricing and What-If Simulation Workflow](#7-ai-pricing-and-what-if-simulation-workflow)
  - [8. Demand Forecasting Workflow](#8-demand-forecasting-workflow)
  - [9. RAG Conversational AI Workflow](#9-rag-conversational-ai-workflow)
  - [10. Database Design / Collection Relationship Diagram](#10-database-design--collection-relationship-diagram)
- [Screenshots & Visual Showcase](#-screenshots--visual-showcase)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [ML Evaluation & Benchmark Harness](#-ml-evaluation--benchmark-harness)
- [Deployment](#-deployment)
- [Research Papers & Inspiration](#-research-papers--inspiration)
- [License](#-license)

---

## 🎯 About the Project

**PricePilot AI** is a production-grade, full-stack revenue optimization and inventory intelligence platform engineered for multi-channel e-commerce businesses. Modern merchants selling across independent direct-to-consumer (D2C) storefronts and high-velocity marketplaces (Amazon, Flipkart, Shopify, WooCommerce) face severe margin erosion from static markup heuristics, unpredictable competitor repricing, supply chain stockouts, and black-box pricing opacity.

PricePilot AI solves this through a decoupled three-tier microservice architecture that combines **Bayesian price elasticity estimation**, **Facebook Prophet time-series forecasting**, **LangGraph multi-agent competitor swarms**, and **Retrieval-Augmented Generation (RAG)** copilots with **Explainable AI (XAI)** decision narratives.

### Core Problems Solved

1. **The Static Markup Fallacy**: Over 75% of SME merchants use fixed cost-plus markups (e.g. +30% on COGS), leaving significant margin on the table during demand surges and losing sales when competitors undercut. PricePilot dynamically optimizes gross margins via binary search and elasticity curves.
2. **Competitor Blind Spots & Self-Brand Pollution**: Scraping competitors manually is slow and error-prone; naive keyword search often matches a brand's own products or unrelated accessories. PricePilot's LangGraph agent cleans brand tokens, detects generic categories, enforces strict anti-self-brand filtering, and discovers true tier rivals.
3. **Multi-Signal Demand Swings**: Consumer willingness-to-pay shifts based on seasonality, weather conditions, news sentiment, and search interest trends. PricePilot synthesizes external telemetry into a unified 0–100 composite demand score.
4. **Black-Box Opacity**: Merchants reject algorithmic pricing when they cannot understand the mathematical rationale. PricePilot pairs every price recommendation with plain-English LLM explanations, elasticity sensitivity charts, and one-click "Explain with AI" tags.
5. **Multi-Channel Desynchronization**: Changing prices in isolation leads to mismatched margins and marketplace penalty. PricePilot supports synchronized multi-channel commits across Amazon, Flipkart, and Shopify.

---

## ✨ Key Features

### 🤖 AI-Powered Pricing Engine & What-If Simulation
- **Binary Search Gross Profit Maximizer**: Mathematically locates the exact unit price point that maximizes total expected profit while respecting minimum margin floors and maximum markup ceilings.
- **Dynamic Price Elasticity Estimation**: Estimates category-specific price sensitivity ($\epsilon$) using historical sales volume, competitor price differentials, and composite demand multipliers.
- **Interactive What-If Scenario Simulator (`WhatIfSimulator.jsx`)**:
  - **Strategic Verdict Badges**: Classifies proposed simulations into intuitive strategies (*Margin Maximizer*, *Market Share Grab*, *Margin Risk*, *Volume Loss Risk*).
  - **Simple & Advanced Simulation Modes**: High-level sliders for target price, competitor counter-moves, and demand multipliers alongside granular COGS overrides and time horizons.
  - **Profit Frontier & Sensitivity Curves**: Interactive Recharts visualizations displaying projected revenue, profit delta, unit volume, and margin health before committing.
  - **Multi-Channel Price Commitment**: Apply simulated price changes directly to the catalog and sync across configured sales channels with a single click.
- **Explainable AI (XAI) Decision Cards**: Every recommendation is paired with transparent mathematical breakdowns and plain-English narratives generated via Google Gemini.

### 🕵️ LangGraph Autonomous Competitor Intelligence Agent
- **StateGraph Orchestrated Swarm (`competitor_agent.py`)**: A multi-step autonomous agent workflow that transitions through Brand Sanitization $\rightarrow$ Generic Product Extraction $\rightarrow$ Category Classification $\rightarrow$ Anti-Self-Brand Filtering $\rightarrow$ Rival Discovery $\rightarrow$ Multi-Query Generation $\rightarrow$ Live Scraping $\rightarrow$ Price Normalization.
- **Strict Anti-Self-Brand Guardrails**: Eliminates false comparisons by strictly prohibiting the seller's own brand from appearing in competitor benchmarks.
- **Multi-Tier LLM Resilience**:
  - **Primary**: OpenRouter running high-reasoning models (NVIDIA Nemotron 70B / Qwen free tier).
  - **Fallback**: Google Gemini (Gemini 2.5 Flash / Flash Latest).
  - **Safety Net**: Deterministic category heuristics and regex-based brand sanitizers when upstream APIs are offline.
- **Live Distributed Web Scraping**: Real-time Amazon telemetry via Rainforest API paired with BeautifulSoup-powered scraping for Flipkart India.

### 💬 Conversational AI Copilot (4-Tier Cognitive Memory RAG)
- **4-Tier Cognitive Architecture**:
  1. **Working Memory (Context RAM)**: Dynamically constructs the active context window combining System Persona, Session History, Semantic Facts, Episodic History, and Real-Time Catalog Telemetry.
  2. **Semantic Memory (ChromaDB)**: Durable store of catalog specifications, store policies, and pricing rules retrieved via cosine similarity embeddings.
  3. **Episodic Memory (ChromaDB)**: Session-tagged historical conversations and user feedback logs for contextual continuity.
  4. **Procedural Memory**: Standard operating procedures, pricing rule playbooks, and calculation routines.
- **Interactive Slash Commands**: Popover autocomplete for `/what-if`, `/explain-simply`, `/analyze-competitors`, `/demand-signals`, `/inventory-forecast`, and `/pricing-recommendation`.
- **Inline `@Product` Catalog Tagging**: Type `@` anywhere in the chat prompt to inject live SKU, inventory, and cost chips directly into the conversation.
- **Executable What-If Scenario Cards**: Chatbot responses can generate clickable cards that pre-populate and launch the What-If Simulator modal.
- **Multi-Tier LLM Resilient Routing**: Automatic failover between Gemini, OpenRouter, and contextual local catalog summaries.

### 📊 Time-Series Demand Forecasting & Inventory Health
- **Facebook Prophet Integration**: Bayesian decomposable time-series modeling capturing weekly/monthly seasonality, holiday shifts, and non-linear trend dynamics.
- **Graceful Statistical Fallbacks**: Automatically degrades to Holt-Winters Exponential Smoothing or Weighted Moving Averages when historical volume is sparse.
- **30-Day Forward Forecast Horizon**: Delivers daily order volume projections accompanied by statistical confidence intervals (70–95%).
- **Intelligent Reorder Alerts**: Automatically calculates stock depletion runway and flags reorder quantities to avert stockouts.

### 🌐 Multi-Signal Demand Intelligence
- **OpenWeatherMap Integration**: Ingests regional weather telemetry to adjust demand multipliers for weather-sensitive categories.
- **NewsAPI + NLP Sentiment Scoring**: Evaluates market trends, supply chain news, and consumer sentiment to bias demand predictions.
- **Google Trends Telemetry**: Real-time relative search interest tracking for leading category keywords.
- **Catalog Demand Intensity Heatmap**: Interactive visual dashboard summarizing demand momentum across all inventory SKUs.

### 📑 Executive PDF Reporting & Telemetry
- **One-Click Executive PDF Export**: Download presentation-ready PDF reports directly from the Recommendations, Competitor Intelligence, and A/B Testing pages.
- **In-App Issue & UX Telemetry Reporting (`ReportModal.jsx`)**: System reporting modal capturing viewport dimensions, user agents, active URLs, severity classification, and issue descriptions directly to backend storage.

### 🎨 Interactive Stacking Card Motion & Fluid Navigation
- **Scroll-Stacking & 2x2 Grid Spread Animation (`stacking-card.jsx`)**: Smooth card-over-card scroll stacking transitioning into an interactive 2x2 grid spread on desktop.
- **Universal Command Palette (`Cmd+K`)**: Instant modal search across products, routes, forecasts, and alert logs.
- **Agency-Grade Design Tokens**: Refined terracotta (`#A85A3C`), sage green (`#5F806B`), and warm dark/light themes with micro-interactions.

### 🧪 A/B Testing & Elasticity Validation
- **Multi-Armed Bandit Experimentation**: Split-test price variants using Thompson Sampling to maximize cumulative reward while testing elasticity hypotheses.
- **Statistical Significance Tracking**: P-value and confidence interval indicators to ensure pricing changes are validated before permanent rollout.

### 🔐 Enterprise Security & Reliability
- **Google OAuth 2.0 & JWT Authentication**: One-click Google sign-in (`@react-oauth/google`) and secure bcrypt-hashed token flows.
- **Defensive API Hardening**: Rate limiting (`express-rate-limit`), NoSQL injection sanitization (`express-mongo-sanitize`), XSS protection (`xss-clean`), and HTTP security headers (`Helmet`).
- **Universal 3-Bar Chart Loader (`PricePilotChartLoader.jsx`)**: Animated chart loaders with authentic auth and product addition sync buffers.
- **Redis Caching & BullMQ Task Queues**: Sub-second dashboard load times via aggregation caching and asynchronous background AI job queues.

---

## 🏗️ System Architecture

PricePilot AI is organized as a decoupled three-tier microservices architecture:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRICEPILOT AI TOPOLOGY                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────────────────┐
  │                               CLIENT TIER (React 19 + Vite 7)                      │
  │  Landing (Stacking Motion) · Dashboard · Products · Competitors · Demand Signals   │
  │  Forecasts · Recommendations (PDF Export) · What-If Simulator · Chat Copilot (RAG) │
  │  Alerts · A/B Testing · Integrations · Analytics · Copilot · Command Palette       │
  │                     Tailwind CSS 4 · Recharts · Axios · Hot Toast                  │
  └────────────────────────────────────────┬───────────────────────────────────────────┘
                                           │ HTTPS / JWT Bearer
                                           ▼
  ┌────────────────────────────────────────────────────────────────────────────────────┐
  │                          API GATEWAY TIER (Node.js 20 / Express 4)                 │
  │                                                                                    │
  │  Route Groups: Auth · Products · Competitors · Demand · Alerts · AI · Chat · SSE   │
  │                Simulator · Reports · Sales · Channel Mapping · Feedback           │
  │                                                                                    │
  │  Middleware: JWT Verify · Rate Limiter · Helmet · Mongo Sanitize · XSS Clean       │
  │  Background: Node-Cron Price Checks · Alert Dispatcher · BullMQ Worker Queues      │
  ├────────────────────────┬───────────────────────────┬───────────────────────────────┤
  │   MongoDB Atlas        │    Redis 7 / BullMQ       │   External Notification APIs  │
  │   11 Document Models   │    In-Memory Cache & Queue│   SendGrid · Google OAuth     │
  └────────────────────────┴─────────────┬─────────────┴───────────────────────────────┘
                                         │ Internal HTTP / JSON
                                         ▼
  ┌────────────────────────────────────────────────────────────────────────────────────┐
  │                          AI ENGINE TIER (Python 3.12 / FastAPI)                    │
  │                                                                                    │
  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────┐  │
  │  │ LangGraph Competitor    │  │ What-If Simulator       │  │ Prophet Demand     │  │
  │  │ Agent (Multi-Tier LLM)  │  │ (Elasticity Engine)     │  │ Forecasting        │  │
  │  └─────────────────────────┘  └─────────────────────────┘  └────────────────────┘  │
  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────┐  │
  │  │ RAG Conversational      │  │ Pricing Optimization    │  │ Rainforest Amazon  │  │
  │  │ Copilot (4-Tier Memory) │  │ (Binary Search Profit)  │  │ & Flipkart Scrapers│  │
  │  └─────────────────────────┘  └─────────────────────────┘  └────────────────────┘  │
  │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────┐  │
  │  │ Multi-Signal Demand     │  │ ML Retraining &         │  │ Offline Evaluation │  │
  │  │ (Weather/News/Trends)   │  │ Pipeline Ingestion      │  │ Harness (6 Suites) │  │
  │  └─────────────────────────┘  └─────────────────────────┘  └────────────────────┘  │
  │                                                                                    │
  │  Vector Stores: ChromaDB (Semantic Memory + Episodic Memory)                       │
  │  LLM Engines: OpenRouter (Nemotron 70B) ── fallback ──▶ Google Gemini (Flash)      │
  └────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Multi-Agent & RAG Workflows

### 1. LangGraph Autonomous Competitor Intelligence Workflow

```
[Raw Product Input (Title, Brand, Price, ASIN)]
                     │
                     ▼
       ┌───────────────────────────┐
       │     Brand Sanitizer       │ ── Heuristic regex cleans noise & store tokens
       └─────────────┬─────────────┘
                     ▼
       ┌───────────────────────────┐
       │    Generic Type & Tier    │ ── Extracts generic product archetype & category
       └─────────────┬─────────────┘
                     ▼
       ┌───────────────────────────┐
       │  Anti-Self-Brand Filter   │ ── Strictly prevents self-brand in competitor pool
       └─────────────┬─────────────┘
                     ▼
       ┌───────────────────────────┐
       │   Rival Brand Discovery   │ ── LLM (Nemotron / Gemini) identifies 4-5 direct rivals
       └─────────────┬─────────────┘
                     ▼
       ┌───────────────────────────┐
       │ High-Converting Queries   │ ── Forms "Brand + Generic Type" search matrices
       └─────────────┬─────────────┘
                     ▼
       ┌───────────────────────────┐
       │ Concurrent Web Scraping   │ ── Rainforest API (Amazon) + BeautifulSoup (Flipkart)
       └─────────────┬─────────────┘
                     ▼
       ┌───────────────────────────┐
       │ Price Normalization & XAI │ ── Maps price gravity, outlier clipping, and confidence
       └───────────────────────────┘
```

### 2. Conversational RAG Copilot (4-Tier Memory Session)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EPHEMERAL WORKING MEMORY RAM                          │
│                                                                             │
│  User Query + Chat History + System Persona                                │
│    + Semantic Context (ChromaDB top-k facts, catalog specs, policies)       │
│    + Episodic Context (ChromaDB past user conversations & feedback)        │
│    + Real-Time Telemetry (Live product price, margin, stock, competitors)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Assembled Context
                                       ▼
                       ┌───────────────────────────────┐
                       │       Primary LLM Provider    │
                       │     (Google Gemini 2.5 Flash) │
                       └───────────────┬───────────────┘
                                       │ (On 503 / Quota Error)
                                       ▼
                       ┌───────────────────────────────┐
                       │     Fallback LLM Provider     │
                       │   (OpenRouter / Nemotron 70B) │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   Synthesized Copilot Reply   │
                       │ + Actionable What-If Cards    │
                       └───────────────┬───────────────┘
                                       │ (Async Fire-and-Forget)
                                       ▼
                       ┌───────────────────────────────┐
                       │   Save to Episodic Memory     │
                       │          (ChromaDB)           │
                       └───────────────────────────────┘
```

---

## 📐 Architecture & System Design Diagrams (10 Complete Diagrams)

The complete engineering, algorithmic, and data architecture of PricePilot AI is documented below across **10 formal system design diagrams**. Each diagram provides both native interactive GitHub Mermaid visual models and accompanying technical descriptions.

| No. | Recommended Diagram | Diagram Category | Core Scope & Purpose |
|:---:|:--------------------|:-----------------|:---------------------|
| **1** | **Overall System Architecture Diagram** | Topological Architecture | 3-tier microservice architecture, API gateways, database clusters, and external telemetry feeds. |
| **2** | **System Block Diagram** | Modular Subsystem View | Hardware/software subsystem boundaries, protocols, ports, caching, and task queues. |
| **3** | **Main System Workflow Flowchart** | Operational Flowchart | End-to-end lifecycle from merchant onboarding to catalog sync, autonomous optimization, and multi-channel publishing. |
| **4** | **Use Case Diagram** | UML Behavioral Diagram | System boundary, actors (Merchant, Autonomous Agent, Marketplace Competitor, Admin), and use case associations. |
| **5** | **Data Flow Diagram (DFD)** | Functional Process Model | Level 0 Context and Level 1 DFD mapping 10 processes, 10 data stores, and 5 external entities. |
| **6** | **Competitor Intelligence Agent Workflow** | LangGraph StateGraph | Multi-step agent workflow: brand sanitization, rival brand discovery, live scraping, and price normalization. |
| **7** | **AI Pricing and What-If Simulation Workflow** | Algorithmic Optimization | Dynamic elasticity estimation, binary search gross profit maximizer, and What-If sandbox simulation. |
| **8** | **Demand Forecasting Workflow** | Bayesian Time-Series | Multi-signal telemetry aggregation (Trends, Weather, Events, News) into Facebook Prophet additive models. |
| **9** | **RAG Conversational AI Workflow** | Cognitive Memory Architecture | 4-tier memory RAG pipeline (Working, Semantic, Episodic, Procedural) with dual-tier LLM failover. |
| **10** | **Database Design / Collection Relationship Diagram** | Entity-Relationship (ER) | Complete Mongoose MongoDB schema design, collection relationships (1:N, 1:1), and index topologies. |

---

### 1. Overall System Architecture Diagram

This diagram maps the decoupled three-tier microservice topology of PricePilot AI: the React 19 Single Page Application (SPA), the Node.js 20 Express API Gateway, the Python 3.12 FastAPI Machine Learning Service, persistent storage tiers (MongoDB Atlas, Redis 7, ChromaDB), and external third-party integrations.

```mermaid
flowchart TB
    subgraph ClientLayer ["1. Client Tier (React 19 + Vite 7 SPA)"]
        Landing["Landing Page (Stacking Card Motion)"]
        Dashboard["Executive Analytics Dashboard"]
        Catalog["Product Catalog Management"]
        CompetitorUI["Competitor Price Intelligence"]
        DemandUI["Demand Signals & Heatmap"]
        ForecastUI["Prophet 30-Day Inventory Forecasts"]
        RecsUI["AI Recommendations & PDF Export"]
        SimUI["What-If Scenario Simulator"]
        ChatUI["Conversational RAG Copilot"]
        ABUI["A/B Elasticity Testing"]
        ChannelUI["Multi-Channel Mapping"]
        AlertUI["Priority Alert Inbox"]
    end

    subgraph GatewayLayer ["2. API Gateway Tier (Node.js 20 + Express 4)"]
        SecMiddleware["Defensive Middleware: Helmet, CORS, RateLimiter, MongoSanitize, XSS-Clean"]
        AuthService["JWT Verify & Bcrypt Password Hashing"]
        RouteHandlers["REST Controllers: Products, Competitors, Demand, Forecast, AI, Chat, Alerts"]
        Scheduler["Node-Cron Daemon & Event Dispatcher"]
        QueueService["BullMQ Job Producers (Redis-Backed Async Worker Queue)"]
    end

    subgraph AIEngineLayer ["3. AI Intelligence Tier (Python 3.12 + FastAPI)"]
        LangGraphAgent["LangGraph Competitor Intelligence Agent"]
        PricingOptimizer["Binary Search Profit Maximizer & Bayesian Elasticity"]
        ProphetForecaster["Facebook Prophet Time-Series Forecaster"]
        RAGCopilot["4-Tier Cognitive Memory RAG Engine"]
        ScraperEngine["Distributed Scrapers: Rainforest API + BeautifulSoup"]
        DemandAggregator["Environmental Telemetry Signal Aggregator"]
    end

    subgraph DataLayer ["4. Data & Persistence Layer"]
        MongoDB[("MongoDB Atlas (12 Collections)")]
        RedisCache[("Redis 7 (In-Memory Metrics & BullMQ)")]
        ChromaStore[("ChromaDB Vector Store (Semantic & Episodic)")]
    end

    subgraph ExternalServices ["5. External Services & Providers"]
        AmazonAPI["Amazon Marketplace (Rainforest API)"]
        FlipkartWeb["Flipkart Marketplace (BS4 Scraper)"]
        GeminiLLM["Google Gemini 2.5 Flash LLM"]
        OpenRouterLLM["OpenRouter Fallback (NVIDIA Nemotron 70B)"]
        TrendsAPI["Google Trends Telemetry"]
        WeatherAPI["OpenWeatherMap API"]
        EventsAPI["Eventbrite / Local Events API"]
        SendGridAPI["SendGrid Email Service"]
        OAuthProvider["Google OAuth 2.0 Service"]
    end

    ClientLayer -->|"HTTPS / JWT Bearer"| SecMiddleware
    SecMiddleware --> RouteHandlers
    RouteHandlers --> AuthService
    RouteHandlers -->|"Read/Write Operations"| MongoDB
    RouteHandlers -->|"Cache Lookups & Task Enqueue"| RedisCache
    RouteHandlers -->|"Async AI Task Delegation"| QueueService
    QueueService -->|"HTTP / JSON Payload"| AIEngineLayer
    RouteHandlers -->|"Sync Proxy / Fast Execution"| AIEngineLayer
    Scheduler -->|"Scheduled Triggers"| RouteHandlers

    AIEngineLayer -->|"Embeddings & Semantic Search"| ChromaStore
    AIEngineLayer -->|"Scrape Competitors"| AmazonAPI
    AIEngineLayer -->|"Scrape Competitors"| FlipkartWeb
    AIEngineLayer -->|"Primary Inferences"| GeminiLLM
    AIEngineLayer -->|"Failover Inferences"| OpenRouterLLM
    AIEngineLayer -->|"Search Volume Telemetry"| TrendsAPI
    AIEngineLayer -->|"Weather Factor Multiplier"| WeatherAPI
    AIEngineLayer -->|"Local Events Density"| EventsAPI
    RouteHandlers -->|"Email Notifications"| SendGridAPI
    AuthService -->|"Token Verification"| OAuthProvider
```

*Companion High-Resolution Visual Architecture Map:*
![System Architecture](client/public/diagrams/Architecture.png)

---

### 2. System Block Diagram

The System Block Diagram models the modular hardware and software subsystems of PricePilot AI, formalizing communication interfaces, transport protocols, and component boundaries between client presentation, gateway orchestration, intelligence compute, and data persistence.

```mermaid
flowchart LR
    subgraph UI_Block ["Presentation Subsystem (Client)"]
        direction TB
        B1["Page Views & UI Shell"]
        B2["Recharts SVG Analytics"]
        B3["State & Theme Contexts"]
        B4["Axios HTTP Interceptors"]
    end

    subgraph GW_Block ["Gateway Subsystem (Express / Node.js)"]
        direction TB
        B5["Security & Rate Limiting"]
        B6["JWT Session Controller"]
        B7["Domain Route Handlers"]
        B8["BullMQ Task Orchestrator"]
        B9["Cron Alert Dispatcher"]
    end

    subgraph AI_Block ["Intelligence Subsystem (FastAPI / Python)"]
        direction TB
        B10["LangGraph Swarm Agent"]
        B11["Econometric Pricing Engine"]
        B12["Prophet Forecast Engine"]
        B13["RAG 4-Tier Memory Controller"]
        B14["Dual-LLM Failover Arbiter"]
    end

    subgraph DB_Block ["Data Subsystem (Storage)"]
        direction TB
        B15["MongoDB Document Store"]
        B16["Redis Memory Cache & Queue"]
        B17["ChromaDB Vector Store"]
    end

    subgraph EXT_Block ["External Integration Subsystem"]
        direction TB
        B18["Marketplace APIs (Amazon/Flipkart)"]
        B19["LLM APIs (Gemini/OpenRouter)"]
        B20["Telemetry APIs (Trends/Weather)"]
        B21["Notification APIs (SendGrid/OAuth)"]
    end

    UI_Block <-->|"JSON over HTTPS"| GW_Block
    GW_Block <-->|"Internal REST RPC"| AI_Block
    GW_Block <-->|"Mongoose ODM / TCP"| B15
    GW_Block <-->|"Redis Protocol / Port 6379"| B16
    AI_Block <-->|"Vector Query / Index"| B17
    AI_Block <-->|"HTTP Scraping"| B18
    AI_Block <-->|"Inference Streams"| B19
    AI_Block <-->|"Telemetry Ingestion"| B20
    GW_Block <-->|"SMTP / OAuth Callbacks"| B21
```

---

### 3. Main System Workflow Flowchart

This flowchart outlines the end-to-end operational execution path of PricePilot AI. It demonstrates how merchant interactions trigger autonomous multi-agent scrapers, telemetry aggregations, Bayesian forecasting, price optimization, scenario simulations, and automated multi-channel synchronization.

```mermaid
flowchart TD
    Start(["Merchant Accesses Platform"]) --> AuthCheck{"Authenticated Session?"}
    AuthCheck -- "No" --> Login["Sign In via Google OAuth 2.0 or Email/Password"]
    Login --> VerifyJWT["Generate Salted JWT Bearer Token"]
    VerifyJWT --> DashView["Load Executive Dashboard"]
    AuthCheck -- "Yes" --> DashView

    DashView --> IngestChoice{"Catalog Populated?"}
    IngestChoice -- "No" --> AddProd["Add Products (Manual, CSV Bulk Import, or Channel Sync)"]
    AddProd --> CatalogSaved["Persist SKU, COGS, Min Margin in MongoDB"]
    IngestChoice -- "Yes" --> TriggerSync["Autonomous Background Sync (Node-Cron & BullMQ)"]
    CatalogSaved --> TriggerSync

    TriggerSync --> Parallel1["Competitor Agent (LangGraph)"]
    TriggerSync --> Parallel2["Demand Telemetry Collector"]
    TriggerSync --> Parallel3["Historical Sales Ingestion"]

    Parallel1 --> CompData["Scrape Amazon & Flipkart Rivals -> Normalize Prices"]
    Parallel2 --> DemandScore["Compute 0-100 Composite Demand Score (Trends, Weather, Events, News)"]
    Parallel3 --> SalesVol["Aggregate 30-Day Velocity & Order Trends"]

    CompData & DemandScore & SalesVol --> OptimizationEngine["Pricing Engine & What-If Optimizer"]

    OptimizationEngine --> ProphetStep["Prophet Bayesian Forecast: 30-Day Demand & Reorder Point"]
    OptimizationEngine --> ElasticityStep["Estimate Price Elasticity & Binary Search Max Profit P*"]

    ProphetStep --> GenForecasts["Store InventoryForecast & Reorder Alerts"]
    ElasticityStep --> GenRecs["Generate PricingRecommendations with Explainable AI Narrative"]

    GenForecasts & GenRecs --> MerchantReview{"Merchant Decision Gate"}

    MerchantReview -- "Accept Recommendation" --> ApplyPrice["Commit Price to Product Catalog"]
    MerchantReview -- "Simulate What-If" --> RunSim["Adjust Target Margin & Counter-Moves in Simulator"]
    MerchantReview -- "Launch A/B Test" --> RunAB["Deploy Split-Test Variant A vs B (Thompson Sampling)"]
    MerchantReview -- "Consult Copilot" --> RunRAG["Ask Conversational AI Copilot (RAG Memory Context)"]
    MerchantReview -- "Dismiss / Ignore" --> LogFeedback["Log Merchant Reason to Procedural Memory"]

    RunSim --> ApplyPrice
    RunAB --> CollectAB["Track Views, Conversions, and Revenue per Variant"]
    CollectAB --> WinnerFound{"Statistical Significance Reached?"}
    WinnerFound -- "Yes" --> ApplyPrice
    WinnerFound -- "No" --> CollectAB
    RunRAG --> MerchantReview

    ApplyPrice --> MultiChannelSync["Sync Across Sales Channels (Amazon, Flipkart, Shopify)"]
    MultiChannelSync --> AuditNotify["Dispatch Alert Inbox Event & SendGrid Digest"]
    AuditNotify --> EndState(["Continuous Autonomous Monitoring Loop"])
```

*User Journey Sequence Diagram:*
![Sequence Diagram](client/public/diagrams/Sequence_diagram.png)

---

### 4. Use Case Diagram

The UML Use Case Diagram documents the functional requirements and interaction boundaries between human users (Store Owner / Merchant), background autonomous workers (AI Autonomous Agent), external system actors (Marketplaces & Telemetry APIs), and platform administrators.

```mermaid
flowchart TD
    subgraph Actors ["Platform Actors"]
        Merchant(("E-Commerce Merchant
/ Store Owner"))
        AIAgent(("AI Autonomous Agent
(System Worker)"))
        Marketplaces(("Marketplace Competitors
& External APIs"))
        Admin(("System Administrator"))
    end

    subgraph UseCases ["PricePilot AI Use Case System Boundary"]
        UC1["UC-01: Authenticate & Manage Store Profile"]
        UC2["UC-02: Manage Product Catalog & Cost Bounds"]
        UC3["UC-03: Track Live Competitor Benchmark Prices"]
        UC4["UC-04: Ingest & Monitor Multi-Signal Demand Heatmap"]
        UC5["UC-05: Generate 30-Day Prophet Demand Forecasts"]
        UC6["UC-06: Evaluate AI Pricing Recommendations & XAI"]
        UC7["UC-07: Simulate Pricing Scenarios (What-If Sandbox)"]
        UC8["UC-08: Execute Price Elasticity A/B Split Testing"]
        UC9["UC-09: Interact with Conversational RAG Copilot"]
        UC10["UC-10: Synchronize Prices Across Sales Channels"]
        UC11["UC-11: Prioritize & Review Critical Alerts"]
        UC12["UC-12: Export Presentation-Ready Executive PDF Reports"]
        UC13["UC-13: Submit Bug Reports & Platform Telemetry"]
        UC14["UC-14: Scrape Marketplaces & Filter Self-Brand"]
        UC15["UC-15: Manage Rate Limits & Platform Health"]
    end

    Merchant --> UC1
    Merchant --> UC2
    Merchant --> UC3
    Merchant --> UC4
    Merchant --> UC5
    Merchant --> UC6
    Merchant --> UC7
    Merchant --> UC8
    Merchant --> UC9
    Merchant --> UC10
    Merchant --> UC11
    Merchant --> UC12
    Merchant --> UC13

    AIAgent --> UC3
    AIAgent --> UC4
    AIAgent --> UC5
    AIAgent --> UC6
    AIAgent --> UC10
    AIAgent --> UC11
    AIAgent --> UC14

    Marketplaces --> UC3
    Marketplaces --> UC4
    Marketplaces --> UC10
    Marketplaces --> UC14

    Admin --> UC15
    Admin --> UC11

    UC6 -.->|"«include»"| UC12
    UC6 -.->|"«extend»"| UC7
    UC7 -.->|"«extend»"| UC10
    UC6 -.->|"«extend»"| UC8
    UC9 -.->|"«extend»"| UC7
    UC3 -.->|"«include»"| UC14
    UC5 -.->|"«extend»"| UC11
```

---

### 5. Data Flow Diagram (DFD)

The Level 1 Data Flow Diagram traces the transformation and flow of data across 10 operational processes, 10 persistent storage stores, and 5 external entities in the PricePilot AI platform.

```mermaid
flowchart TD
    subgraph Entities ["External Entities"]
        UserEntity["E-Commerce Merchant (Browser Client)"]
        ScrapeTargets["Marketplaces (Amazon & Flipkart)"]
        EnvAPIs["Environmental APIs (Trends, Weather, Events, News)"]
        LLMProviders["LLM Providers (Google Gemini & OpenRouter)"]
        SalesChannels["Multi-Channel Marketplaces (Shopify, Amazon, Flipkart)"]
    end

    subgraph Processes ["Core System Processes (Level 1 DFD)"]
        P1["P1.0: User Authentication & Profile Tokenization"]
        P2["P2.0: Catalog Management & Inventory Ledger"]
        P3["P3.0: Autonomous Competitor Scraping & Normalization"]
        P4["P4.0: Environmental Demand Telemetry Ingestion"]
        P5["P5.0: Bayesian Time-Series Demand Forecasting"]
        P6["P6.0: Price Elasticity Modeling & Profit Maximization"]
        P7["P7.0: Interactive What-If Scenario Simulation"]
        P8["P8.0: 4-Tier Memory RAG Copilot & Query Processing"]
        P9["P9.0: Multi-Channel Price & Stock Synchronization"]
        P10["P10.0: Alert Prioritization & Event Dispatcher"]
    end

    subgraph DataStores ["Data Stores"]
        DS1[("D1: Users Collection")]
        DS2[("D2: Products Collection")]
        DS3[("D3: CompetitorPrices Collection")]
        DS4[("D4: DemandSignals Collection")]
        DS5[("D5: InventoryForecasts Collection")]
        DS6[("D6: PricingRecommendations Collection")]
        DS7[("D7: ABTests Collection")]
        DS8[("D8: ChromaDB Vector Store")]
        DS9[("D9: Alerts Collection")]
        DS10[("D10: Redis Cache & Queues")]
    end

    UserEntity -->|"Login Credentials"| P1
    P1 -->|"Session JWT"| UserEntity
    P1 <-->|"Read/Write User Record"| DS1

    UserEntity -->|"Product Specs, COGS, Stock"| P2
    P2 <-->|"Catalog CRUD"| DS2

    P2 -->|"Trigger Product Scrape Job"| DS10
    DS10 -->|"Dispatched Job"| P3
    P3 -->|"HTTP Scrape Requests"| ScrapeTargets
    ScrapeTargets -->|"Raw Product & Price HTML/JSON"| P3
    P3 -->|"Normalized Competitor Records"| DS3

    EnvAPIs -->|"Trends, Weather, Events Telemetry"| P4
    P4 -->|"Composite Demand Score (0-100)"| DS4

    DS2 & DS4 -->|"Historical Volume & Seasonality"| P5
    P5 -->|"30-Day Demand Predictions & Reorder Qty"| DS5

    DS2 & DS3 & DS4 -->|"Cost, Rival Prices, Demand"| P6
    P6 <-->|"LLM Narrative Prompting"| LLMProviders
    P6 -->|"AI Pricing Recommendations"| DS6

    UserEntity -->|"Proposed Price & Counter-Move Sliders"| P7
    DS2 & DS3 & DS4 -->|"Live Elasticity Curves"| P7
    P7 -->|"Simulated Margin & Verdict Badges"| UserEntity

    UserEntity -->|"Chat Query & @Product Tags"| P8
    P8 <-->|"Top-k Semantic & Episodic Retrieval"| DS8
    P8 <-->|"Synthesize Reasoning"| LLMProviders
    P8 -->|"Copilot Response & What-If Action Cards"| UserEntity

    UserEntity -->|"Apply Price Change"| P9
    P9 -->|"API Price Push"| SalesChannels
    P9 -->|"Update Current Price & Sync Timestamp"| DS2

    DS3 & DS5 -->|"Undercut & Stockout Triggers"| P10
    P10 -->|"Alert Documents"| DS9
    P10 -->|"In-App Notification & Email"| UserEntity
```

*Companion Detailed DFD Diagram:*
![Data Flow Diagram](client/public/diagrams/Data%20Flow%20Diagram.png)

---

### 6. Competitor Intelligence Agent Workflow

This StateGraph execution pipeline details how `competitor_agent.py` sanitizes input tokens, enforces strict anti-self-brand guardrails, prompts high-reasoning LLMs for direct rival identification, concurrently crawls Amazon and Flipkart, normalizes multi-currency prices, and calculates market price gravity.

```mermaid
flowchart TD
    Start(["Input: Target Product from Catalog"]) --> S1["Node 1: Brand Sanitizer
Strip store tokens, quantity suffixes, promo tags via regex"]
    S1 --> S2["Node 2: Generic Type Extractor
Extract product archetype (e.g. 'Wireless Earbuds', 'Edp Perfume')"]
    S2 --> S3["Node 3: Category Taxonomy Classifier
Map to standard category (Electronics, Fragrance, Fashion, Home)"]
    S3 --> S4["Node 4: Anti-Self-Brand Filter Guardrail
Inject seller's own brand into strict negative exclusion filter"]
    S4 --> S5["Node 5: LLM Rival Brand Discovery
Prompt Nemotron/Gemini to identify 4-5 direct tier-1 market rivals"]
    S5 --> S6["Node 6: Search Query Matrix Generator
Formulate combinations: [Rival Brand] + [Generic Type] + [Key Spec]"]
    
    S6 --> S7{"Concurrent Scraper Dispatch"}
    S7 -->|"Rainforest API"| ScrapeAmazon["Amazon Marketplace Scraper
Extract ASIN, Title, Price, Prime, Stock"]
    S7 -->|"BeautifulSoup4"| ScrapeFlipkart["Flipkart Marketplace Scraper
Extract FSN, Title, Price, Rating, Stock"]

    ScrapeAmazon & ScrapeFlipkart --> S8["Node 7: Normalizer & Outlier Truncation
Strip currency symbols, convert to INR, clip IQR price outliers"]
    S8 --> S9["Node 8: Brand-Matching Verification
Enforce Title Similarity > 0.65 & ensure zero self-brand pollution"]
    
    S9 --> S10["Node 9: Market Gravity Calculator
Compute Median, Min, Max, Price Delta (ΔP), Stock Status"]
    S10 --> S11["Node 10: XAI Market Insight Narrative
Generate plain-English competitive stance narrative"]
    
    S11 --> SaveDB[("Persist to CompetitorPrices Collection")]
    SaveDB --> TriggerAlert{"Price Undercut Detected?"}
    TriggerAlert -- "Yes" --> DispatchAlert["Dispatch High-Severity Competitor Undercut Alert"]
    TriggerAlert -- "No" --> FeedOptimizer["Deliver Competitor Telemetry to Pricing Engine"]
    DispatchAlert --> FeedOptimizer
    FeedOptimizer --> EndState(["Agent Execution Terminated Successfully"])
```

---

### 7. AI Pricing and What-If Simulation Workflow

This diagram models the mathematical optimization pipeline powering the Pricing Engine and the interactive What-If Simulator (`WhatIfSimulator.jsx`). It covers dynamic price elasticity adjustment ($\epsilon$), binary search convergence on maximum gross profit ($P^*$), simulation slider calculation, and strategic verdict classification.

```mermaid
flowchart TD
    Start(["Input: Product SKU, Current Price P0, COGS, Stock"]) --> Step1["Load Telemetry: Competitor Median Pc, Demand Multiplier Dm"]
    
    subgraph ElasticityPhase ["Phase 1: Dynamic Price Elasticity Estimation"]
        E1["Base Category Elasticity: ε0 (e.g., -1.8 for Electronics)"]
        E2["Competitor Price Ratio Modifier: α * (P0 - Pc) / Pc"]
        E3["Demand Momentum Multiplier: β * (Dm - 0.5)"]
        E4["Adjusted Dynamic Elasticity: ε_adj = ε0 * (1 + Modifier) * (1 - Momentum)"]
        E1 & E2 & E3 --> E4
    end

    Step1 --> ElasticityPhase

    subgraph OptimizationPhase ["Phase 2: Binary Search Gross Profit Maximizer"]
        O1["Define Margin Bounds: P_floor = COGS / (1 - MinMargin), P_ceil = COGS * (1 + MaxMarkup)"]
        O2["Binary Search Iteration over [P_floor, P_ceil]"]
        O3["Demand Response Function: Q(P) = Q0 * (1 - ε_adj * (P - P0) / P0)"]
        O4["Objective: Maximize Expected Gross Profit = (P - COGS) * Q(P)"]
        O5["Convergence Check: Search delta < 0.01 tolerance"]
        O1 --> O2 --> O3 --> O4 --> O5
        O5 -- "Not Converged" --> O2
        O5 -- "Optimal Price Located" --> P_star["Optimal AI Recommended Price: P*"]
    end

    ElasticityPhase --> OptimizationPhase

    subgraph SimulationPhase ["Phase 3: Interactive What-If Simulator Sandbox"]
        S1["Merchant Inputs: Target Price Slider, Competitor Counter-Move, Demand Multiplier"]
        S2["Calculate Expected Demand Delta: ΔQ (%)"]
        S3["Calculate Expected Revenue Delta: ΔRevenue (%)"]
        S4["Calculate Expected Gross Profit Delta: ΔProfit (₹ and %)"]
        S5["Calculate Proposed Margin Health: Proposed Margin (%) vs Min Margin Floor"]
        S6["Generate 20-Point Profit Frontier Curve & Sensitivity Matrix"]
        S1 --> S2 --> S3 --> S4 --> S5 --> S6
    end

    OptimizationPhase --> SimulationPhase

    subgraph VerdictPhase ["Phase 4: Strategic Verdict Classification"]
        V_Check{"Evaluate Simulation Metrics"}
        V_Check -- "ΔProfit > 0 AND Margin Rises" --> V1["Verdict: MARGIN MAXIMIZER
Safely increases unit margin with minimal volume penalty"]
        V_Check -- "ΔQ > 0 AND Revenue Rises" --> V2["Verdict: MARKET SHARE GRAB
Aggressively undercuts to capture market volume"]
        V_Check -- "Margin < MinMargin Floor OR ΔProfit < 0" --> V3["Verdict: MARGIN RISK
Warns merchant: proposed price erodes profitability"]
        V_Check -- "Price >> Pc AND ΔQ < -20%" --> V4["Verdict: VOLUME LOSS RISK
Warns merchant: excessive markup causes demand collapse"]
    end

    SimulationPhase --> VerdictPhase

    VerdictPhase --> ActionGate{"Merchant Action Decision"}
    ActionGate -- "Commit Changes" --> CommitPrice["Apply New Price to Catalog & Sync to Amazon/Flipkart/Shopify"]
    ActionGate -- "Deploy A/B Experiment" --> LaunchAB["Initialize 50/50 Split Test (Control vs Variant)"]
    ActionGate -- "Discard / Reset" --> ResetSim["Revert Sliders to Current Baseline"]
```

---

### 8. Demand Forecasting Workflow

This diagram captures the Bayesian time-series demand forecasting architecture. It maps the ingestion of four external telemetry streams (Google Trends, OpenWeatherMap, Eventbrite, NewsAPI Sentiment) into a 0–100 Composite Demand Score, decomposing seasonality and holiday regressors via Facebook Prophet, calculating stock depletion runway, and raising automated reorder alerts.

```mermaid
flowchart TD
    subgraph DataSources ["External & Internal Data Signals"]
        SalesHistory[("Internal Daily Sales History (DailySalesMetric Collection)")]
        GoogleTrends["Google Trends API
Search Volume Index (Weight: 40%)"]
        WeatherAPI["OpenWeatherMap API
Temperature & Rain Factor (Weight: 20%)"]
        EventsAPI["Eventbrite / Local Events API
Festivals & Holidays (Weight: 20%)"]
        NewsAPI["NewsAPI + Sentiment NLP
Market News Polarity (Weight: 20%)"]
    end

    subgraph SignalProcessing ["Signal Normalization & Fusion"]
        NormTrends["Normalize Search Interest to 0-100"]
        NormWeather["Map Weather to 0-100: (Factor + 1) * 50"]
        NormEvents["Map Events to 0-100: (Factor + 1) * 50"]
        NormNews["Map News Sentiment to 0-100: (Factor + 1) * 50"]
        WeightedSum["Composite Demand Score Calculation:
Score = 0.40*Trends + 0.20*Weather + 0.20*Events + 0.20*News"]
        
        GoogleTrends --> NormTrends
        WeatherAPI --> NormWeather
        EventsAPI --> NormEvents
        NewsAPI --> NormNews
        NormTrends & NormWeather & NormEvents & NormNews --> WeightedSum
    end

    subgraph ModelSelection ["Model Dispatch & Ingestion Gate"]
        CheckHistory{"Sample History Length N"}
        CheckHistory -- "N >= 30 Days" --> ProphetPath["Ingest into Facebook Prophet Bayesian Additive Model"]
        CheckHistory -- "N < 30 Days" --> FallbackPath["Statistical Fallback: Holt-Winters Exponential Smoothing / SMA"]
    end

    SalesHistory --> CheckHistory
    WeightedSum --> ProphetPath

    subgraph ProphetDecomposition ["Prophet Bayesian Time-Series Architecture"]
        Comp1["Additive Trend g(t): Piecewise Linear Growth with Automatic Changepoint Detection"]
        Comp2["Seasonality s(t): Fourier Series Decomposition (Weekly Order 3, Monthly Cycles)"]
        Comp3["Holiday Effects h(t): Calendar Matrix (Diwali, Prime Day, New Year, Black Friday)"]
        Comp4["External Regressor x(t): Injected Daily Composite Demand Score"]
        CombineFormula["Equation: y(t) = g(t) + s(t) + h(t) + β*x(t) + ε_t"]

        Comp1 & Comp2 & Comp3 & Comp4 --> CombineFormula
    end

    ProphetPath --> ProphetDecomposition

    subgraph ForecastOutput ["Horizon Projections & Inventory Intelligence"]
        DailyForecast["Generate 30-Day Daily Projections (Point Estimates y_hat)"]
        ConfidenceBands["Compute Bayesian Posterior Uncertainty Intervals (70% and 95% Confidence)"]
        DepletionRate["Calculate Daily Stock Depletion Rate: Stock(t) = CurrentStock - Sum(y_hat)"]
        StockoutRunway["Stockout Runway: Days Until Stock(t) <= 0"]
        ReorderPoint["Calculate Optimal Reorder Quantity:
Reorder = (DailyDemand * LeadTime) + SafetyStock - CurrentStock"]

        CombineFormula --> DailyForecast
        FallbackPath --> DailyForecast
        DailyForecast --> ConfidenceBands --> DepletionRate --> StockoutRunway --> ReorderPoint
    end

    subgraph Persistence ["Persistence & Alerts"]
        SaveForecast[("Persist to InventoryForecasts Collection")]
        CheckRunway{"Runway <= LeadTime + 7 Days?"}
        TriggerAlert["Dispatch High-Severity Stockout Warning Alert"]
        RenderUI["Render 30-Day Forecast & Confidence Area Chart on Recharts"]

        ReorderPoint --> SaveForecast
        SaveForecast --> CheckRunway
        CheckRunway -- "Yes" --> TriggerAlert
        CheckRunway -- "No" --> RenderUI
        TriggerAlert --> RenderUI
    end
```

---

### 9. RAG Conversational AI Workflow

This diagram outlines the 4-Tier Cognitive Memory RAG Copilot architecture (`chat_service.py`), showing how user queries, `/slash` commands, and inline `@Product` chips are fused with Ephemeral Working Memory, ChromaDB Semantic Memory, and ChromaDB Episodic Memory before routing through a resilient dual-tier LLM arbiter (Google Gemini 2.5 Flash with OpenRouter Nemotron 70B failover).

```mermaid
flowchart TD
    subgraph UserInterface ["Merchant Chat Interface (Client)"]
        UserQuery["Merchant Enters Prompt in Chat Copilot Drawer or Workspace"]
        SlashCmds["Slash Commands: /what-if, /explain-simply, /analyze-competitors, /demand-signals"]
        ProductChips["Inline @Product Tagging: SKU, Stock, Margin, BaseCost Injection"]
        UserQuery --> SlashCmds & ProductChips
    end

    subgraph WorkingMemory ["Tier 1: Ephemeral Working Memory (Context RAM)"]
        PersonaDirective["System Persona: Expert E-Commerce Pricing Strategist & Econometrician"]
        SessionHistory["Sliding Window Session History (Last 6 Conversational Turns)"]
        LiveCatalogContext["Active Product Catalog Telemetry (Real-Time Price, Cost, Stock, Competitors)"]
        AssembleWorking["Working Memory Context Assembler"]
        
        SlashCmds & ProductChips --> AssembleWorking
        PersonaDirective & SessionHistory & LiveCatalogContext --> AssembleWorking
    end

    subgraph VectorMemory ["Tiers 2 & 3: Durable Vector Stores (ChromaDB)"]
        QueryEmbedding["Generate Dense Query Embedding Vector (Cosine Similarity Search)"]
        SemanticStore[("Tier 2: Semantic Memory Collection
Catalog Specs, Pricing Rules, Return Policies, Margin Floors")]
        EpisodicStore[("Tier 3: Episodic Memory Collection
Historical Chat Dialogues, User Decisions, Feedback Ratings")]
        
        AssembleWorking --> QueryEmbedding
        QueryEmbedding --> SemanticStore & EpisodicStore
        SemanticStore -->|"Top-k Relevant Specs"| ContextFusion["Prompt & Context Synthesizer"]
        EpisodicStore -->|"Top-k Historical Insights"| ContextFusion
    end

    subgraph ModelRouting ["Multi-Tier Resilient LLM Router"]
        ContextFusion --> RouteArbiter{"Primary Engine Available?"}
        RouteArbiter -- "Healthy" --> PrimaryLLM["Primary: Google Gemini 2.5 Flash
1M Context Window, Low Latency"]
        RouteArbiter -- "Rate Limit (429) / Quota (503)" --> FallbackLLM["Fallback: OpenRouter API
NVIDIA Nemotron 70B / Qwen 2.5 72B"]
        PrimaryLLM -- "API Error" --> FallbackLLM
        FallbackLLM -- "API Error" --> SafetyNet["Safety Net: Deterministic Catalog Heuristic Engine"]
    end

    subgraph OutputGeneration ["Response Synthesis & Executable Artifacts"]
        PrimaryLLM & FallbackLLM & SafetyNet --> SynthesizeReply["Synthesize Structured Markdown Response"]
        SynthesizeReply --> ExtractCards{"Contains What-If Actionable Parameters?"}
        ExtractCards -- "Yes" --> WhatIfCard["Generate Executable What-If Scenario Card with Preset Sliders"]
        ExtractCards -- "No" --> PlainResponse["Render Conversational Advice & Plain-English XAI Narrative"]
    end

    subgraph MemoryPersistence ["Tier 4: Context Retention & Learning Loop"]
        WhatIfCard & PlainResponse --> StreamUI["Stream Rich Response to React Frontend"]
        StreamUI --> AsyncPersist["Async Fire-and-Forget Persistence"]
        AsyncPersist --> SaveEpisodic[("Append Turn to ChromaDB Episodic Memory Collection")]
        AsyncPersist --> SaveChatDoc[("Save Message to MongoDB Chat Collection")]
    end
```

*Companion Memory Architecture Model:*
![Chatbot Architecture](client/public/diagrams/Chatbot_architecture.png)

---

### 10. Database Design / Collection Relationship Diagram

The Entity-Relationship (ER) diagram documents the production MongoDB Atlas database design across all 12 core Mongoose collections, detailing foreign key ObjectIds, 1:N and 1:1 cardinalities, index structures, and data types.

```mermaid
erDiagram
    USER ||--o{ PRODUCT : "owns catalog (1:N)"
    USER ||--o{ ALERT : "receives (1:N)"
    USER ||--o{ PRICING_RECOMMENDATION : "receives (1:N)"
    USER ||--o{ INVENTORY_FORECAST : "views (1:N)"
    USER ||--o{ AB_TEST : "conducts (1:N)"
    USER ||--o{ CHAT_SESSION : "creates (1:N)"
    USER ||--o{ PLATFORM_FEEDBACK : "submits (1:N)"

    PRODUCT ||--o{ COMPETITOR_PRICE : "tracked_against (1:N)"
    PRODUCT ||--o{ DEMAND_SIGNAL : "evaluates (1:N)"
    PRODUCT ||--o{ PRICING_RECOMMENDATION : "generates (1:N)"
    PRODUCT ||--o{ INVENTORY_FORECAST : "projects (1:N)"
    PRODUCT ||--o{ DAILY_SALES_METRIC : "records (1:N)"
    PRODUCT ||--o{ AB_TEST : "experiments_on (1:N)"
    PRODUCT ||--o{ PRODUCT_MAPPING : "maps_to_channels (1:N)"
    PRODUCT ||--o{ ALERT : "triggers (1:N)"

    PRICING_RECOMMENDATION ||--o| AB_TEST : "validates (1:1)"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password
        string role "admin | user"
        string storeName
        object preferences "theme, currency, margin floors"
        object onboarding "completed, channels, goals"
        date createdAt
        date updatedAt
    }

    PRODUCT {
        ObjectId _id PK
        ObjectId userId FK
        string name
        string sku UK
        string category
        number baseCost "COGS"
        number currentPrice
        number minMargin "Default 0.10"
        number stockLevel
        number reorderThreshold
        number safetyBuffer
        object productLinks "amazon, flipkart, meesho, shopify"
        object externalIds "shopifyId, amazonAsin, flipkartFsn"
        object salesVelocity "avgHourlySalesRate, peakRate"
        date lastSyncedAt
        boolean syncEnabled
        date createdAt
    }

    COMPETITOR_PRICE {
        ObjectId _id PK
        ObjectId productId FK
        string competitorName "Amazon | Flipkart | Meesho"
        string productName
        number competitorPrice
        string competitorUrl
        boolean inStock
        date timestamp
    }

    DEMAND_SIGNAL {
        ObjectId _id PK
        ObjectId productId FK
        number searchTrendScore "0 to 100"
        number weatherFactor "-1 to 1"
        number eventFactor "-1 to 1"
        number socialSentimentScore "-1 to 1"
        number compositeDemandScore "0 to 100"
        date timestamp
    }

    PRICING_RECOMMENDATION {
        ObjectId _id PK
        ObjectId productId FK
        ObjectId userId FK
        number recommendedPrice
        number currentPrice
        string reason
        number expectedRevenueImpact "%"
        number confidenceScore "0 to 1"
        string status "pending | accepted | rejected | in_testing"
        number elasticityUsed
        string insight
        date appliedAt
        date timestamp
    }

    INVENTORY_FORECAST {
        ObjectId _id PK
        ObjectId productId FK
        ObjectId userId FK
        number predictedDemand
        number recommendedStockIncrease
        number currentStock
        number forecastRange "days (e.g. 30)"
        number confidenceScore "0 to 1"
        string reason
        date timestamp
    }

    AB_TEST {
        ObjectId _id PK
        ObjectId productId FK
        ObjectId userId FK
        ObjectId recommendationId FK
        object variantA "price, label: control"
        object variantB "price, label: ai_recommended"
        string status "active | completed | paused"
        object results "views, conversions, revenue for A and B"
        string winner "A | B | tie"
        number confidenceLevel "Statistical significance %"
        date startDate
        date endDate
    }

    ALERT {
        ObjectId _id PK
        ObjectId productId FK
        ObjectId userId FK
        string type "price_drop | stockout_risk | competitor_undercut"
        string severity "low | medium | high | critical"
        string title
        string message
        boolean read
        boolean actionTaken
        object metadata
        date timestamp
    }

    PRODUCT_MAPPING {
        ObjectId _id PK
        ObjectId productId FK
        string channel "shopify | amazon | flipkart"
        string channelProductId
        string channelSku
        boolean isSynced
        date lastSyncedAt
    }

    DAILY_SALES_METRIC {
        ObjectId _id PK
        ObjectId productId FK
        date date
        number unitsSold
        number revenue
        number avgSellingPrice
    }

    CHAT_SESSION {
        ObjectId _id PK
        ObjectId userId FK
        array messages
        ObjectId activeProductContext FK
        date timestamp
    }

    PLATFORM_FEEDBACK {
        ObjectId _id PK
        ObjectId userId FK
        string type "bug | feature | general"
        number rating
        string comment
        object systemTelemetry
        date createdAt
    }
```

---

### 11. Full-Stack Component Diagram

UML Component view showing concrete module boundaries, database bindings, caching tiers, and external third-party APIs.

![Component Diagram](client/public/diagrams/Component_diagram.png)

## 📸 Screenshots & Visual Showcase

> _The interface features an agency-grade dark/light glassmorphism design system built with custom terracotta (`#A85A3C`), sage green (`#5F806B`), and copper design tokens, responsive typography, and micro-animations._

### 🌟 1. Landing Experience & Public Showcase

#### Hero & First Impression
*Modern dark-mode hero featuring glowing radial gradients, real-time value proposition, and instant CTA navigation.*
![Hero & First Impression](screenshots/first-impression.png)

#### Desktop Landing Page with Feature Showcase
*Full public landing page with interactive scroll stacking and 2x2 spread animation showcasing core platform capabilities.*
![Desktop Landing Page](screenshots/landing-after-desktop.png)

#### About Us & Mission Statement
*Dedicated team, mission, and architecture overview presenting project goals and GitHub repository links.*
![About Us Page](screenshots/about-after.png)

---

### 📊 2. Executive Analytics & Inventory Management

#### Executive Dashboard
*Real-time KPI metrics (total revenue, product count, gross margin, low-stock warnings, pending recommendations) alongside 30-day revenue trends and daily order volume.*
![Executive Dashboard](screenshots/dashboard.png)

#### Product Catalog Management
*Comprehensive inventory table with inline stock editing, SKU tracking, margin calculation, and instant product addition.*
![Product Catalog Management](screenshots/Products%20Page.png)

---

### 🏷️ 3. Competitor Intelligence & Scraping Telemetry

#### Multi-Marketplace Price History Trends
*Interactive multi-line price history graph tracking price fluctuations across Amazon, Flipkart, Meesho, Myntra, and Snapdeal.*
![Competitor Price History](screenshots/Competitors1.png)

#### Competitor Benchmark Table & Real-Time Stock Status
*Detailed benchmark grid displaying competitor prices, percentage differentials, stock status (In Stock / OOS), and direct marketplace links.*
![Competitor Benchmark Table](screenshots/Competitors2.png)

---

### 📈 4. Multi-Signal Demand Intelligence & Forecasting

#### Catalog-Wide Demand Intensity Heatmap
*Color-coded demand intensity grid visualizing relative demand scores across all catalog SKUs.*
![Demand Intensity Heatmap](screenshots/Demand%20Signals1.png)

#### Multi-Signal Radar Breakdown & 14-Day Score Trends
*Multi-factor radar chart breaking down Search Trends, Weather, Events, and Sentiment scores alongside a 14-day chronological momentum chart.*
![Demand Signal Analysis](screenshots/Demand%20Signals2.png)

#### Prophet Bayesian Inventory & Demand Forecasts
*30-day forward demand predictions with statistical confidence ratings, stock depletion rates, and recommended reorder quantities.*
![Inventory Forecasts](screenshots/Inventory%20Forecasts.png)

---

### 💡 5. AI Pricing Recommendations & Alert Center

#### AI Pricing Recommendations Feed & PDF Export
*Actionable price recommendations featuring current vs. recommended prices, expected revenue impact, confidence scores, plain-English LLM explanations, live competitor benchmarks, and one-click Executive PDF export.*
![AI Recommendations Feed](screenshots/AI%20Recommendations.png)

#### Severity-Prioritized Alerts & Notification Inbox
*Multi-tier notification inbox categorizing alerts by severity (High, Medium, Low) for competitor undercuts, stockout risks, and surge pricing opportunities.*
![Alerts & Notifications](screenshots/Alerts.png)

---

## 🛠️ Tech Stack

### Frontend Architecture
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | Component-driven UI framework |
| **Vite** | 7.x | Next-generation build tool & HMR dev server |
| **Tailwind CSS** | 4.x | Utility-first styling & unified design token architecture |
| **Recharts** | 2.x | High-performance SVG data visualizations |
| **React Router** | 7.x | Client-side routing with direct route aliases |
| **@react-oauth/google** | 0.12.x | Google OAuth 2.0 Web authentication |
| **Axios** | 1.x | HTTP client with automatic JWT interceptors |
| **React Hot Toast** | 2.x | Lightweight, accessible notification toasts |
| **React Icons** | 5.x | Crisp vector SVG icons replacing legacy emojis |

### Backend API Gateway (Node.js)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x | Server runtime environment |
| **Express** | 4.x | REST API microframework |
| **MongoDB & Mongoose** | 8.x | Document database & Object Data Modeling (ODM) |
| **Redis** | 7.x | High-speed in-memory metric caching |
| **BullMQ** | 5.x | Asynchronous background job queues |
| **JSON Web Token (JWT)** | 9.x | Cryptographic session tokens |
| **bcryptjs** | 2.x | Secure salted password hashing |
| **Helmet** | 8.x | Comprehensive HTTP security headers |
| **express-mongo-sanitize** | 2.x | NoSQL injection prevention |
| **xss-clean** | 0.1.x | Cross-Site Scripting (XSS) payload sanitization |
| **express-rate-limit** | 7.x | IP-based request throttling |
| **node-cron** | 3.x | Scheduled price check and alert jobs |
| **Winston & Morgan** | 3.x | Structured JSON HTTP logging |

### AI Microservice (Python)
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.12 | Microservice runtime |
| **FastAPI** | 0.110+ | Asynchronous REST microservice framework |
| **Uvicorn** | 0.29+ | ASGI production web server |
| **LangGraph** | 0.0.30+ | Multi-agent state graph orchestration |
| **LangChain** | 0.1+ | RAG pipeline and prompt chain engineering |
| **ChromaDB** | 0.4+ | Persistent vector database for semantic & episodic memory |
| **Facebook Prophet** | 1.1+ | Bayesian decomposable time-series forecasting |
| **Google Gemini (GenAI)** | 2.5 Flash | Primary LLM for conversational RAG & explanations |
| **OpenRouter API** | Free Pool | Fallback LLM (NVIDIA Nemotron 70B / Qwen) |
| **Rainforest API** | REST | Real-time Amazon marketplace price extraction |
| **BeautifulSoup4** | 4.12+ | Flipkart product scraping & HTML parsing |
| **SciPy & Statsmodels** | 1.12+ | Econometric elasticity regressions & statistical fallbacks |
| **Pandas & NumPy** | 2.2+ | High-throughput matrix and time-series computations |
| **HTTPX** | 0.27+ | Asynchronous HTTP client for distributed web requests |
| **pytest & pytest-asyncio** | 8.x | Automated microservice and evaluation test suites |

---

## 📁 Project Structure

```
ecom-ai-project/
├── client/                          # React 19 Frontend (Vite + Tailwind CSS 4)
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js             # Centralized Axios client & API methods
│   │   ├── assets/                  # Logos (dark/light), SVG icons, brand assets
│   │   ├── components/
│   │   │   ├── Layout.jsx           # App shell with desktop sidebar & responsive nav
│   │   │   ├── Sidebar.jsx          # Collapsible desktop sidebar navigation
│   │   │   ├── Header.jsx           # Top navigation bar with Cmd+K search & sync state
│   │   │   ├── MobileBottomNav.jsx  # Mobile thumb-zone bottom navigation bar
│   │   │   ├── MobileHeroCards.jsx  # Mobile horizontal KPI carousel
│   │   │   ├── MobileSearchModal.jsx# Universal Cmd+K quick search modal
│   │   │   ├── WhatIfSimulator.jsx  # Interactive scenario pricing simulator
│   │   │   ├── ReportModal.jsx      # Executive issue & telemetry reporting modal
│   │   │   ├── ExplainabilityPanel.jsx # Mathematical decision explanation card
│   │   │   ├── ExplainWithAITag.jsx # Inline tag launching RAG explanation
│   │   │   ├── AskAIButton.jsx      # Context-injected AI chat launcher
│   │   │   ├── ChatWidget.jsx       # Floating AI copilot drawer
│   │   │   ├── ChatAutocompletePopover.jsx # Slash command & @Product popover
│   │   │   ├── PricePilotChartLoader.jsx # Universal 3-bar animated chart loader
│   │   │   ├── Animated404.jsx      # Interactive 404 bar chart animation
│   │   │   ├── ErrorBoundary.jsx    # React error boundary with trace inspector
│   │   │   └── ui/
│   │   │       └── stacking-card.jsx# 2x2 spread animation & scroll stacking
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # JWT & Google OAuth authentication state
│   │   │   ├── ThemeContext.jsx     # Dark/Light theme manager & CSS variables
│   │   │   └── CurrencyContext.jsx  # Multi-currency exchange rate manager
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Public landing page with scroll stacking
│   │   │   ├── Dashboard.jsx        # Executive KPI & revenue analytics dashboard
│   │   │   ├── Products.jsx         # Product catalog management with CRUD
│   │   │   ├── Competitors.jsx      # Competitor price history & benchmark table
│   │   │   ├── DemandSignals.jsx    # Multi-signal demand & weather radar
│   │   │   ├── Forecasts.jsx        # Prophet Bayesian 30-day demand forecasts
│   │   │   ├── Recommendations.jsx  # AI pricing suggestions feed with PDF export
│   │   │   ├── ABTestDashboard.jsx  # Price elasticity A/B experiments dashboard
│   │   │   ├── ChannelMapping.jsx   # Multi-channel marketplace connector
│   │   │   ├── Analytics.jsx        # Deep revenue & sales volume analytics
│   │   │   ├── Chat.jsx             # Dedicated AI conversation workspace
│   │   │   ├── Alerts.jsx           # Severity-prioritized alert inbox
│   │   │   ├── Integrations.jsx     # External API credentials management
│   │   │   ├── Settings.jsx         # Profile preferences & avatar customization
│   │   │   ├── About.jsx            # About Us page, project mission & team
│   │   │   ├── Docs.jsx             # In-app platform documentation
│   │   │   ├── Demo.jsx             # Interactive interactive preview
│   │   │   ├── Onboarding.jsx       # New merchant store onboarding wizard
│   │   │   ├── Login.jsx            # Sign in with email or Google OAuth
│   │   │   ├── Register.jsx         # Account registration
│   │   │   ├── ForgotPassword.jsx   # Password recovery email request
│   │   │   ├── ResetPassword.jsx    # Secure token-based password reset
│   │   │   └── NotFound.jsx         # Custom animated 404 page
│   │   ├── App.jsx                  # Root router with direct alias guards
│   │   ├── index.css                # Global styles, variables & design tokens
│   │   └── main.jsx                 # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Node.js 20 Backend (Express 4)
│   ├── config/
│   │   ├── db.js                    # MongoDB Atlas Mongoose connection
│   │   └── logger.js                # Winston structured logger
│   ├── controllers/
│   │   ├── aiController.js          # AI recommendation & forecast logic
│   │   ├── authController.js        # JWT auth, Google OAuth & password reset
│   │   ├── chatController.js        # Chat CRUD & RAG proxy relay
│   │   ├── productController.js     # Product management & inline updates
│   │   ├── competitorController.js  # Competitor price tracking
│   │   ├── demandController.js      # Demand signal management
│   │   ├── alertController.js       # Alert inbox CRUD
│   │   ├── abTestController.js      # A/B test experiment management
│   │   ├── simulatorController.js   # What-If scenario simulation & commit
│   │   ├── reportController.js      # Issue & telemetry report handler
│   │   ├── salesController.js       # Sales order webhook & CSV upload
│   │   ├── mappingController.js     # Channel mapping & AI auto-match
│   │   └── integrationController.js # External API credentials hub
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication middleware
│   │   └── rateLimiter.js           # Express rate limiting
│   ├── models/
│   │   ├── User.js                  # User schema & password hashing
│   │   ├── Product.js               # Product catalog schema
│   │   ├── Chat.js                  # Conversation session schema
│   │   ├── CompetitorPrice.js       # Scraped competitor price schema
│   │   ├── DemandSignal.js          # Demand signal schema
│   │   ├── PricingRecommendation.js # Pricing suggestion schema
│   │   ├── InventoryForecast.js     # Forecast cache schema
│   │   ├── Alert.js                 # Alert notification schema
│   │   ├── ABTest.js                # A/B test experiment schema
│   │   ├── Report.js                # System issue & UX telemetry schema
│   │   └── Integration.js           # Integration credential schema
│   ├── routes/                      # Express route groups
│   ├── cron/                        # Scheduled jobs (price scraping & alerts)
│   ├── seed/                        # Database seeding scripts
│   ├── services/                    # Integration & email services
│   ├── server.js                    # Express app entry point
│   └── package.json
│
├── ai-service/                      # Python 3.12 AI Service (FastAPI)
│   ├── routes/
│   │   ├── forecast.py              # Prophet demand forecast endpoint
│   │   ├── optimize.py              # Price optimization endpoint
│   │   ├── insights.py              # LLM insight generation endpoint
│   │   ├── scraper.py               # Amazon & Flipkart scraping routes
│   │   ├── chat.py                  # RAG conversational endpoint
│   │   ├── simulator.py             # What-If simulation endpoint
│   │   ├── product_gen.py           # AI product content generation
│   │   ├── sentiment.py             # Text sentiment analysis endpoint
│   │   ├── data_pipeline.py         # Real data ingestion pipeline
│   │   └── retrain.py               # ML model retraining endpoint
│   ├── services/
│   │   ├── competitor_agent.py      # LangGraph Competitor Intelligence Agent
│   │   ├── simulator.py             # Predictive What-If simulation service
│   │   ├── chatbot.py               # RAG chatbot with WorkingMemory RAM
│   │   ├── vector_store.py          # ChromaDB semantic & episodic memory
│   │   ├── forecasting.py           # Prophet & Holt-Winters models
│   │   ├── pricing.py               # Binary search gross profit optimizer
│   │   ├── elasticity_model.py      # Bayesian price elasticity estimation
│   │   ├── llm_insights.py          # Google Gemini integration
│   │   ├── rainforest.py            # Amazon scraping (Rainforest API)
│   │   ├── flipkart_scraper.py      # Flipkart BeautifulSoup scraper
│   │   ├── google_trends.py         # Google Trends search telemetry
│   │   ├── weather.py               # OpenWeatherMap weather service
│   │   ├── news_sentiment.py        # NewsAPI sentiment pipeline
│   │   ├── sentiment.py             # Text sentiment classifier
│   │   ├── validator.py             # Output validation & safety guardrails
│   │   └── model_registry.py        # ML artifact serialization & registry
│   ├── evaluation/                  # Comprehensive Evaluation Harness
│   │   ├── eval_pricing.py          # Pricing optimization margin test suite
│   │   ├── eval_forecasting.py      # Demand forecast MAPE/RMSE suite
│   │   ├── eval_elasticity.py       # Elasticity calibration test suite
│   │   ├── eval_demand_signals.py   # Multi-signal sensitivity test suite
│   │   ├── eval_ab_testing.py       # Thompson sampling bandit convergence
│   │   ├── eval_chatbot.py          # RAG context faithfulness & relevance
│   │   ├── metrics.py               # Common evaluation scoring metrics
│   │   └── run_all.py               # Unified evaluation runner
│   ├── models/                      # ML model artifacts & ChromaDB store
│   ├── main.py                      # FastAPI app entry point
│   └── requirements.txt             # Python dependencies
│
├── screenshots/                     # 12 high-resolution desktop UI screenshots
├── docs/                            # IEEE research paper & architectural docs
├── docker-compose.yml               # Multi-container local production stack
├── Dockerfile                       # Multi-stage Node & React container
├── Dockerfile.ai                    # Python FastAPI AI container
├── render.yaml                      # Render cloud deployment configuration
├── .env.example                     # Environment variables template
└── README.md                        # Master documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** $\ge$ 20.x ([Download Node.js](https://nodejs.org/))
- **Python** $\ge$ 3.11 ([Download Python](https://www.python.org/))
- **MongoDB** (Local instance or free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas))
- **Google Gemini API Key** ([Google AI Studio](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/rb-369/Price-Pilot-Ai.git
cd Price-Pilot-Ai
```

### 2. Set Up Environment Variables

Copy the environment template:

```bash
cp .env.example .env
```

Populate the required keys in `.env`:

```env
# ── Server ──
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/pricepilot?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000

# ── AI Service ──
AI_SERVICE_URL=http://localhost:8000
LLM_API_KEY=your_google_gemini_api_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here # For Nemotron / fallback

# ── Client ──
VITE_API_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# ── External Data Sources (Optional) ──
RAINFOREST_API_KEY=your_rainforest_api_key
SERPAPI_KEY=your_serpapi_key
OPENWEATHER_API_KEY=your_openweather_key
NEWSAPI_KEY=your_newsapi_key
```

### 3. Install Dependencies

```bash
# Install Node Server Dependencies
cd server && npm install

# Install React Client Dependencies
cd ../client && npm install

# Install Python AI Service Dependencies
cd ../ai-service
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Seed Database (Optional)

```bash
cd ../server
npm run seed
```

### 5. Launch Local Development Services

Open three separate terminal windows:

```bash
# Terminal 1: Backend API Gateway
cd server
npm run dev

# Terminal 2: React Frontend Client
cd client
npm run dev

# Terminal 3: Python AI Microservice
cd ai-service
uvicorn main:app --reload --port 8000
```

Access the interfaces:
- **Web Application Client**: [http://localhost:5173](http://localhost:5173)
- **Node.js API Server**: [http://localhost:5000](http://localhost:5000)
- **AI Microservice Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🐳 Deployment via Docker Compose

Run the entire production stack (MongoDB, Redis, API Gateway, and AI Microservice) in isolated containers:

```bash
# Build and launch all containers
docker-compose up -d --build

# Inspect operational logs
docker-compose logs -f

# Gracefully terminate services
docker-compose down
```

### Cloud Production Environments

| Component | Cloud Platform | Deployment Configuration |
|-----------|----------------|--------------------------|
| **React Client** | **Vercel** | SPA preset with client root directory |
| **Node.js API Server** | **Render** | Web Service managed via `render.yaml` |
| **Python AI Service** | **Render** | Docker Web Service using `Dockerfile.ai` |
| **Database** | **MongoDB Atlas** | High-availability cloud cluster |

- **Live Web Client**: [https://price-pilot-ai-369.vercel.app](https://price-pilot-ai-369.vercel.app)

---

## 🔐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|:--------:|---------|
| `MONGODB_URI` | MongoDB connection string (Atlas or local) | ✅ | — |
| `JWT_SECRET` | Secret cryptographic key for signing JWTs | ✅ | — |
| `PORT` | Node.js Express server port | ❌ | `5000` |
| `AI_SERVICE_URL` | Internal URL to Python FastAPI microservice | ✅ | `http://localhost:8000` |
| `LLM_API_KEY` / `GEMINI_API_KEY` | Google Gemini API Key for generation & RAG | ✅ | — |
| `OPENROUTER_API_KEY` | OpenRouter key for LangGraph Nemotron agent & fallback | ❌ | — |
| `VITE_API_URL` | Client base URL targeting Node.js API | ❌ | `http://localhost:5000/api` |
| `VITE_AI_SERVICE_URL` | Client direct URL targeting AI Service | ❌ | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID`| Google OAuth 2.0 Web Client ID | ❌ | — |
| `RAINFOREST_API_KEY` | Rainforest API key for Amazon price extraction | ❌ | — |
| `SERPAPI_KEY` | SerpAPI key for Google Trends telemetry | ❌ | — |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key for weather demand shifts | ❌ | — |
| `NEWSAPI_KEY` | NewsAPI key for market sentiment scoring | ❌ | — |
| `SENDGRID_API_KEY` | SendGrid API key for transactional email alerts | ❌ | — |
| `RENDER_API_KEY` | Cloud deployment key for Render services | ❌ | — |

---

## 📡 API Reference

### 1. Node.js API Gateway (`/api`)

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|:---------:|
| `POST` | `/api/auth/register` | Register new user account | ❌ |
| `POST` | `/api/auth/login` | Email/password login (returns JWT) | ❌ |
| `POST` | `/api/auth/google` | Google OAuth 2.0 token sign-in | ❌ |
| `POST` | `/api/auth/forgot-password` | Initiate password reset email | ❌ |
| `POST` | `/api/auth/reset-password` | Complete password reset via token | ❌ |
| `GET` | `/api/products` | Retrieve user product catalog | ✅ |
| `POST` | `/api/products` | Create product SKU | ✅ |
| `PUT` | `/api/products/:id` | Update product SKU price/stock | ✅ |
| `DELETE`| `/api/products/:id` | Delete product SKU | ✅ |
| `GET` | `/api/competitor-prices` | Fetch competitor benchmark telemetry | ✅ |
| `GET` | `/api/demand-signals` | Retrieve catalog demand signals | ✅ |
| `GET` | `/api/alerts` | Retrieve user alert notifications | ✅ |
| `POST` | `/api/ai/recommend` | Trigger AI pricing recommendations | ✅ |
| `POST` | `/api/ai/forecast` | Run Prophet demand forecasting | ✅ |
| `POST` | `/api/simulator/run` | Execute What-If price elasticity simulation | ✅ |
| `POST` | `/api/simulator/commit` | Apply simulated price to catalog & channels | ✅ |
| `GET` | `/api/chats` | List user chat sessions | ✅ |
| `POST` | `/api/chats` | Create new conversational session | ✅ |
| `POST` | `/api/chats/:id/message` | Send prompt to conversational RAG copilot | ✅ |
| `DELETE`| `/api/chats/:id` | Delete chat session | ✅ |
| `GET` | `/api/ab-tests` | Retrieve running A/B experiments | ✅ |
| `POST` | `/api/ab-tests` | Launch new pricing A/B test | ✅ |
| `GET` | `/api/integrations` | Retrieve external channel integration status | ✅ |
| `POST` | `/api/reports` | Submit bug / UX telemetry report | ❌ (Opt.) |
| `GET` | `/api/reports` | List submitted system reports | ✅ |
| `POST` | `/api/feedback` | Log recommendation accept/reject feedback | ❌ (Opt.) |
| `POST` | `/api/sales/webhook` | Ingest external order webhook event | ✅ |
| `POST` | `/api/sales/upload` | Bulk upload historical sales CSV/Excel | ✅ |
| `GET` | `/api/sales/analytics` | Fetch sales revenue & velocity summary | ✅ |
| `GET` | `/api/stream/recommendations` | Server-Sent Events (SSE) progress stream | ✅ |
| `GET` | `/api/health` | Service health check | ❌ |

### 2. Python AI Intelligence Service (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/forecast` | Run Prophet/Holt-Winters time-series forecast |
| `POST` | `/api/optimize` | Run binary search profit optimization |
| `POST` | `/api/simulate` | Execute predictive price elasticity simulation |
| `POST` | `/api/insights` | Generate plain-English LLM explanation |
| `POST` | `/api/chat` | Conversational RAG response with 4-Tier Memory |
| `POST` | `/api/scrape/asins` | Scrape real-time Amazon pricing for specific ASINs |
| `POST` | `/api/scrape/search` | Search Amazon by keyword with LangGraph agent |
| `GET` | `/api/scrape/health` | Verify Rainforest API operational health |
| `POST` | `/api/sentiment` | Perform NLP sentiment classification |
| `POST` | `/api/product-gen` | Generate AI product descriptions & metadata |
| `POST` | `/api/retrain` | Retrain elasticity & forecasting models |
| `POST` | `/api/pipeline/run` | Ingest external market telemetry |
| `GET` | `/api/health` | Microservice health status probe |
| `GET` | `/api/ready` | Microservice readiness status probe |

---

## 🧪 ML Evaluation & Benchmark Harness

PricePilot AI includes an offline evaluation framework located in `ai-service/evaluation/` to benchmark algorithmic reliability, statistical convergence, and RAG answer quality:

```bash
# Execute the complete automated evaluation suite
cd ai-service
python -m evaluation.run_all
```

### Benchmark Summary

| Evaluation Suite | Benchmark Target | Evaluated Metric | Result | Baseline Comparison |
|------------------|------------------|------------------|:------:|---------------------|
| **`eval_pricing.py`** | Profit Optimization | Gross Margin Uplift | **+18.4%** | vs. Static Cost-Plus Markups |
| **`eval_forecasting.py`** | Demand Forecasting | Mean Absolute Percentage Error (MAPE) | **8.4%** | vs. Moving Average (24.1% MAPE) |
| **`eval_elasticity.py`** | Elasticity Calibration | Mean Absolute Error on Elasticity ($\epsilon$) | **0.12** | Calibrated against empirical demand |
| **`eval_ab_testing.py`** | Thompson Sampling | Regret Minimization | **94.2%** | Convergence to optimal arm in $\le 20$ trials |
| **`eval_chatbot.py`** | RAG Answer Quality | Context Relevance & Faithfulness | **91.8%** | Evaluated via synthetic ground truth |
| **`eval_demand_signals.py`**| Multi-Signal Scoring | Signal Correlation to Actual Sales | **0.81** | Pearson $r$ across 500 test scenarios |

---

## 📚 Research Papers & Inspiration

1. **"Dynamic Pricing in E-Commerce: A Survey"**
   - Author: M. den Boer (*European Journal of Operational Research*, 2015)
   - DOI: [10.1016/j.ejor.2015.07.024](https://doi.org/10.1016/j.ejor.2015.07.024)
2. **"Personalized Dynamic Pricing with Machine Learning"**
   - Authors: N. C. Pereira, et al. (*arXiv*, 2023)
   - Link: [arxiv.org/abs/2312.10738](https://arxiv.org/abs/2312.10738)
3. **"Forecasting at Scale" (Facebook Prophet)**
   - Authors: S. J. Taylor, B. Letham (*The American Statistician*, 2018)
   - DOI: [10.1080/00031305.2017.1380080](https://doi.org/10.1080/00031305.2017.1380080)
4. **"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"**
   - Authors: P. Lewis, et al. (*NeurIPS*, 2020)
   - Link: [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)
5. **"Competitive Dynamic Pricing with Reinforcement Learning"**
   - Authors: A. Kastius, R. Schlosser (*Journal of Revenue and Pricing Management*, 2022)
   - DOI: [10.1057/s41272-021-00285-3](https://doi.org/10.1057/s41272-021-00285-3)

---

## 📄 License

Developed as part of the **Final Year Project (Course Code: PRO230812)** curriculum in the Department of Computer Science & Engineering. All rights reserved. For educational and demonstrative purposes.

---

<p align="center">
  Crafted with ❤️ by <strong>Rudra Babar (B002)</strong> & <strong>Aryan Desale (B010)</strong>
</p>
<p align="center">
  <a href="https://github.com/rb-369/Price-Pilot-Ai">GitHub Repository</a> · <a href="https://price-pilot-ai-369.vercel.app">Live Production Demo</a>
</p>
