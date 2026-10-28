"""
Generate all 10 Academic/Professional System Architecture & Design Diagrams
for PricePilot AI in authentic Excalidraw hand-drawn whiteboard format.
Outputs to: docs/diagrams/ and client/public/diagrams/
"""

import os
import random
import shutil
from PIL import Image, ImageDraw, ImageFont

# Set consistent seed so diagrams look natural and stable
random.seed(42)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "diagrams")
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "client", "public", "diagrams")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

# Fonts
FONT_REG_PATH = "C:\\Windows\\Fonts\\segoepr.ttf"
FONT_BOLD_PATH = "C:\\Windows\\Fonts\\segoeprb.ttf"

def get_font(size, bold=False):
    path = FONT_BOLD_PATH if bold else FONT_REG_PATH
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# Excalidraw Palette
CANVAS_BG = (253, 251, 247)  # Warm paper off-white
INK = (30, 30, 35)           # Dark charcoal ink
INK_MUTED = (95, 100, 110)   # Secondary ink
INK_LIGHT = (140, 145, 155)

# Pastel fills & sketch borders
FILL_WHITE  = (255, 255, 255)
FILL_PEACH  = (254, 237, 232)
LINE_PEACH  = (180, 80, 50)     # Terracotta

FILL_SAGE   = (232, 245, 236)
LINE_SAGE   = (55, 110, 75)     # Sage Green

FILL_BLUE   = (234, 242, 254)
LINE_BLUE   = (40, 95, 180)     # Blue

FILL_AMBER  = (254, 248, 226)
LINE_AMBER  = (190, 125, 25)    # Amber/Gold

FILL_PURPLE = (244, 234, 254)
LINE_PURPLE = (125, 60, 175)    # Purple

FILL_GRAY   = (244, 245, 247)
LINE_GRAY   = (140, 145, 155)

def sketch_rect(draw, bbox, fill, stroke, width=2, corner_r=10):
    x1, y1, x2, y2 = bbox
    # Base fill
    draw.rounded_rectangle([x1, y1, x2, y2], radius=corner_r, fill=fill)
    
    # 2 slightly jittered outlines for the organic hand-drawn sketch feel
    for _ in range(2):
        pts = [
            (x1 + random.randint(-1, 1), y1 + random.randint(-1, 1)),
            (x2 + random.randint(-1, 1), y1 + random.randint(-1, 1)),
            (x2 + random.randint(-1, 1), y2 + random.randint(-1, 1)),
            (x1 + random.randint(-1, 1), y2 + random.randint(-1, 1)),
            (x1 + random.randint(-1, 1), y1 + random.randint(-1, 1))
        ]
        draw.line(pts, fill=stroke, width=width, joint='curve')

def sketch_dashed_rect(draw, bbox, stroke, width=2):
    x1, y1, x2, y2 = bbox
    # Draw dashed bounding box
    step = 16
    for x in range(x1, x2, step * 2):
        draw.line([(x, y1), (min(x + step, x2), y1)], fill=stroke, width=width)
        draw.line([(x, y2), (min(x + step, x2), y2)], fill=stroke, width=width)
    for y in range(y1, y2, step * 2):
        draw.line([(x1, y), (x1, min(y + step, y2))], fill=stroke, width=width)
        draw.line([(x2, y), (x2, min(y + step, y2))], fill=stroke, width=width)

def sketch_arrow(draw, start, end, color=INK, width=3, label=""):
    x1, y1 = start
    x2, y2 = end
    
    # Slightly natural line
    mid_x = (x1 + x2) / 2 + random.randint(-2, 2)
    mid_y = (y1 + y2) / 2 + random.randint(-2, 2)
    draw.line([(x1, y1), (mid_x, mid_y), (x2, y2)], fill=color, width=width)
    
    # Arrow head
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 16
    head_angle = math.pi / 7
    
    left_x = x2 - arrow_len * math.cos(angle - head_angle)
    left_y = y2 - arrow_len * math.sin(angle - head_angle)
    right_x = x2 - arrow_len * math.cos(angle + head_angle)
    right_y = y2 - arrow_len * math.sin(angle + head_angle)
    
    draw.polygon([(x2, y2), (left_x, left_y), (right_x, right_y)], fill=color)
    
    if label:
        font = get_font(15, bold=True)
        bbox = draw.textbbox((0, 0), label, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        lx = (x1 + x2 - tw) // 2
        ly = (y1 + y2 - th) // 2 - 14
        # Pill under label
        draw.rounded_rectangle([lx - 8, ly - 4, lx + tw + 8, ly + th + 4], radius=6, fill=FILL_WHITE, outline=LINE_GRAY, width=1)
        draw.text((lx, ly), label, fill=color, font=font)

def sketch_cylinder(draw, bbox, fill, stroke, width=2):
    x1, y1, x2, y2 = bbox
    h_cap = 24
    # Bottom ellipse
    draw.ellipse([x1, y2 - h_cap, x2, y2 + h_cap], fill=fill, outline=stroke, width=width)
    # Middle body
    draw.rectangle([x1, y1 + h_cap // 2, x2, y2], fill=fill, outline=None)
    draw.line([(x1, y1 + h_cap // 2), (x1, y2)], fill=stroke, width=width)
    draw.line([(x2, y1 + h_cap // 2), (x2, y2)], fill=stroke, width=width)
    # Top ellipse
    draw.ellipse([x1, y1, x2, y1 + h_cap], fill=fill, outline=stroke, width=width)

def draw_header(draw, W, title, subtitle):
    # Header Banner
    sketch_rect(draw, (40, 30, W - 40, 130), FILL_WHITE, INK, width=2, corner_r=12)
    font_title = get_font(30, bold=True)
    font_sub = get_font(18, bold=False)
    draw.text((65, 45), title, fill=LINE_PEACH, font=font_title)
    draw.text((65, 88), subtitle, fill=INK_MUTED, font=font_sub)

def save_both(img, filename):
    out_path = os.path.join(OUT_DIR, filename)
    pub_path = os.path.join(PUBLIC_DIR, filename)
    img.save(out_path, format="PNG", optimize=True)
    img.save(pub_path, format="PNG", optimize=True)
    print(f"Generated: {filename} -> {out_path}")

# ==============================================================================
# DIAGRAM 1: Overall System Architecture Diagram
# ==============================================================================
def gen_diag_01():
    W, H = 2500, 1600
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "01. Overall System Architecture Diagram", "PricePilot AI — Decoupled 3-Tier Enterprise Microservices Topology")

    # 1. Client Tier Box
    sketch_rect(draw, (50, 160, 1750, 520), FILL_WHITE, LINE_PEACH, width=3, corner_r=16)
    draw.text((75, 175), "1. CLIENT TIER (React 19 + Vite 7 SPA)", fill=LINE_PEACH, font=get_font(22, bold=True))
    draw.text((650, 180), "Tailwind CSS 4  •  Recharts  •  Axios  •  Command Palette (Cmd+K)  •  Stacking Card Motion", fill=INK_MUTED, font=get_font(16))

    client_modules = [
        ("Landing Showcase", "Interactive Stacking Motion", FILL_PEACH, LINE_PEACH),
        ("Executive Dashboard", "Real-Time Revenue & Margin", FILL_SAGE, LINE_SAGE),
        ("Products Catalog", "SKU, COGS & Stock Control", FILL_BLUE, LINE_BLUE),
        ("Competitor Radar", "Live Multi-Marketplace Prices", FILL_AMBER, LINE_AMBER),
        ("Demand Signals", "Weather, Trends & News Radar", FILL_PURPLE, LINE_PURPLE),
        ("30-Day Forecasts", "Prophet Bayesian Time-Series", FILL_BLUE, LINE_BLUE),
        ("AI Recommendations", "Profit Frontier & PDF Export", FILL_PEACH, LINE_PEACH),
        ("What-If Simulator", "Elasticity & Counter-Move Sliders", FILL_SAGE, LINE_SAGE),
        ("AI Copilot Chat", "RAG Drawer & Slash Commands", FILL_PURPLE, LINE_PURPLE),
        ("A/B Testing", "Thompson Sampling Multi-Armed Bandit", FILL_AMBER, LINE_AMBER),
        ("Channel Mapping", "Shopify, Amazon & Flipkart Sync", FILL_BLUE, LINE_BLUE),
        ("Alerts Inbox", "Priority Stockout & Undercuts", FILL_PEACH, LINE_PEACH),
    ]
    cw, ch = 260, 68
    for i, (m_title, m_desc, m_fill, m_line) in enumerate(client_modules):
        col, row = i % 6, i // 6
        cx = 75 + col * (cw + 18)
        cy = 230 + row * (ch + 16)
        sketch_rect(draw, (cx, cy, cx + cw, cy + ch), m_fill, m_line, 1, 8)
        draw.text((cx + 12, cy + 10), m_title, fill=INK, font=get_font(16, bold=True))
        draw.text((cx + 12, cy + 36), m_desc, fill=INK_MUTED, font=get_font(13))

    sketch_arrow(draw, (450, 520), (450, 600), LINE_PEACH, 3, "HTTPS / JWT Bearer (JSON APIs)")

    # 2. Gateway Tier Box
    sketch_rect(draw, (50, 600, 1750, 1020), FILL_WHITE, LINE_SAGE, width=3, corner_r=16)
    draw.text((75, 615), "2. API GATEWAY TIER (Node.js 20 + Express 4)", fill=LINE_SAGE, font=get_font(22, bold=True))
    draw.text((650, 620), "JWT Verification  •  Helmet Security  •  Express Rate Limit  •  Node-Cron  •  BullMQ Async Worker", fill=INK_MUTED, font=get_font(16))

    # Gateway internal columns
    gw_boxes = [
        ("Express Route Groups", [
            "/api/auth (OAuth & JWT)",
            "/api/products (CRUD Catalog)",
            "/api/competitors (Prices)",
            "/api/demand (Signal Heatmap)",
            "/api/ai/pricing (Optimizer)",
            "/api/chat (RAG Stream SSE)",
            "/api/simulator (What-If)"
        ], FILL_SAGE, LINE_SAGE, 500),
        ("Defensive Middleware", [
            "Helmet (HTTP Headers)",
            "Rate Limiter (Anti-DDoS)",
            "Mongo-Sanitize (NoSQL)",
            "XSS-Clean (Payload Sanitizer)",
            "CORS Access Control",
            "Bcrypt (Salted Hashing)",
            "Winston JSON Logger"
        ], FILL_GRAY, LINE_GRAY, 500),
        ("Async Queue & Cron Daemon", [
            "BullMQ Task Producer",
            "Redis Job Backing",
            "Hourly Competitor Price Check",
            "Stockout Risk Scanner",
            "Telemetry Polling Worker",
            "SendGrid Mail Dispatcher",
            "WebSocket Real-Time Sync"
        ], FILL_BLUE, LINE_BLUE, 550)
    ]
    cur_x = 75
    for b_title, b_items, b_fill, b_line, b_w in gw_boxes:
        sketch_rect(draw, (cur_x, 660, cur_x + b_w, 990), b_fill, b_line, 1, 10)
        draw.text((cur_x + 18, 675), b_title, fill=b_line, font=get_font(18, bold=True))
        for line_i, item in enumerate(b_items):
            draw.text((cur_x + 22, 715 + line_i * 36), "•  " + item, fill=INK, font=get_font(15))
        cur_x += b_w + 25

    sketch_arrow(draw, (450, 1020), (450, 1100), LINE_SAGE, 3, "Internal REST RPC / JSON")

    # 3. AI Microservice Tier Box
    sketch_rect(draw, (50, 1100, 1750, 1540), FILL_WHITE, LINE_BLUE, width=3, corner_r=16)
    draw.text((75, 1115), "3. AI INTELLIGENCE ENGINE (Python 3.12 + FastAPI)", fill=LINE_BLUE, font=get_font(22, bold=True))
    draw.text((700, 1120), "LangGraph Swarms  •  Prophet Forecasting  •  ChromaDB Vectors  •  Binary Search Optimizer", fill=INK_MUTED, font=get_font(16))

    ai_engines = [
        ("LangGraph Competitor Agent", "StateGraph multi-agent cleaner, rival discovery & live web crawler", FILL_AMBER, LINE_AMBER),
        ("Prophet Time-Series Forecaster", "Bayesian additive seasonality, trend & holiday decomposition (30d)", FILL_BLUE, LINE_BLUE),
        ("Binary Search Profit Optimizer", "Dynamic elasticity estimation (ε) maximizing expected gross profit", FILL_PEACH, LINE_PEACH),
        ("4-Tier Memory RAG Copilot", "Working context + Semantic & Episodic ChromaDB vector retrieval", FILL_PURPLE, LINE_PURPLE),
        ("Environmental Signal Fusion", "Google Trends (40%) + Weather (20%) + Events (20%) + News (20%)", FILL_SAGE, LINE_SAGE),
        ("Offline Evaluation Harness", "6 quantitative test suites: Latency, RMSE, MAP, Grounding Score", FILL_GRAY, LINE_GRAY),
    ]
    ew, eh = 515, 85
    for i, (e_title, e_desc, e_fill, e_line) in enumerate(ai_engines):
        col, row = i % 3, i // 3
        ex = 75 + col * (ew + 28)
        ey = 1165 + row * (eh + 25)
        sketch_rect(draw, (ex, ey, ex + ew, ey + eh), e_fill, e_line, 1, 10)
        draw.text((ex + 16, ey + 12), e_title, fill=INK, font=get_font(17, bold=True))
        draw.text((ex + 16, ey + 42), e_desc, fill=INK_MUTED, font=get_font(14))

    # Right Column: Data Layer + External Services
    ext_x = 1840
    ext_w = 610

    # Persistence Stores
    sketch_rect(draw, (ext_x, 160, ext_x + ext_w, 750), FILL_WHITE, INK, width=3, corner_r=16)
    draw.text((ext_x + 25, 180), "PERSISTENT DATA STORES", fill=INK, font=get_font(22, bold=True))
    
    sketch_cylinder(draw, (ext_x + 35, 230, ext_x + 290, 440), FILL_SAGE, LINE_SAGE, 2)
    draw.text((ext_x + 55, 300), "MongoDB Atlas", fill=LINE_SAGE, font=get_font(19, bold=True))
    draw.text((ext_x + 55, 335), "12 Mongoose Collections", fill=INK_MUTED, font=get_font(14))
    draw.text((ext_x + 55, 360), "Catalog, Users, Prices, Recs", fill=INK_MUTED, font=get_font(13))

    sketch_cylinder(draw, (ext_x + 320, 230, ext_x + 575, 440), FILL_PEACH, LINE_PEACH, 2)
    draw.text((ext_x + 355, 300), "Redis 7 Cache", fill=LINE_PEACH, font=get_font(19, bold=True))
    draw.text((ext_x + 355, 335), "BullMQ Task Queues", fill=INK_MUTED, font=get_font(14))
    draw.text((ext_x + 355, 360), "In-Memory Metric Cache", fill=INK_MUTED, font=get_font(13))

    sketch_cylinder(draw, (ext_x + 180, 480, ext_x + 440, 690), FILL_PURPLE, LINE_PURPLE, 2)
    draw.text((ext_x + 215, 550), "ChromaDB Store", fill=LINE_PURPLE, font=get_font(19, bold=True))
    draw.text((ext_x + 210, 585), "Semantic & Episodic Memory", fill=INK_MUTED, font=get_font(14))
    draw.text((ext_x + 215, 610), "text-embedding-3 / Cosine", fill=INK_MUTED, font=get_font(13))

    # External APIs
    sketch_rect(draw, (ext_x, 790, ext_x + ext_w, 1540), FILL_WHITE, INK, width=3, corner_r=16)
    draw.text((ext_x + 25, 810), "EXTERNAL PLATFORMS & APIS", fill=INK, font=get_font(22, bold=True))

    ext_apis = [
        ("Amazon Marketplace", "Rainforest API Live Price Extraction", FILL_AMBER, LINE_AMBER),
        ("Flipkart Marketplace", "BeautifulSoup4 Web Scraping Engine", FILL_AMBER, LINE_AMBER),
        ("Google Gemini 2.5 Flash", "Primary LLM: Inferences, XAI & Explanations", FILL_BLUE, LINE_BLUE),
        ("OpenRouter (Nemotron 70B)", "Fallback High-Reasoning LLM Pool", FILL_PURPLE, LINE_PURPLE),
        ("Google Trends API", "Keyword Relative Search Volume Telemetry", FILL_BLUE, LINE_BLUE),
        ("OpenWeatherMap API", "Regional Weather & Precipitation Signals", FILL_SAGE, LINE_SAGE),
        ("Eventbrite / Events API", "Local Cultural Holidays & Event Density", FILL_PEACH, LINE_PEACH),
        ("SendGrid SMTP", "Real-Time Email Alert & Daily Digest", FILL_BLUE, LINE_BLUE),
        ("Google OAuth 2.0", "One-Click Merchant Authentication", FILL_SAGE, LINE_SAGE),
    ]
    for idx, (api_name, api_sub, a_fill, a_line) in enumerate(ext_apis):
        ay = 860 + idx * 72
        sketch_rect(draw, (ext_x + 30, ay, ext_x + ext_w - 30, ay + 60), a_fill, a_line, 1, 8)
        draw.text((ext_x + 48, ay + 10), api_name, fill=INK, font=get_font(16, bold=True))
        draw.text((ext_x + 48, ay + 32), api_sub, fill=INK_MUTED, font=get_font(13))

    save_both(img, "01_overall_system_architecture.png")

# ==============================================================================
# DIAGRAM 2: System Block Diagram
# ==============================================================================
def gen_diag_02():
    W, H = 2400, 1400
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "02. System Block Diagram", "PricePilot AI — Modular Subsystem Interfaces, Transport Protocols & Bus Architecture")

    subsystems = [
        ("PRESENTATION SUBSYSTEM\n(React 19 + Vite 7)", [
            "View Controller & App Router",
            "Recharts SVG Chart Engine",
            "Theme & Currency State Contexts",
            "Axios HTTP Interceptor Layer",
            "Universal Cmd+K Search Palette",
            "Stacking Card Animation Engine"
        ], FILL_PEACH, LINE_PEACH, 50, 180, 420, 680),

        ("GATEWAY SUBSYSTEM\n(Node.js 20 + Express 4)", [
            "Defensive Security Middleware",
            "JWT Auth Session Manager",
            "Catalog & Price REST Handlers",
            "BullMQ Task Orchestrator",
            "Cron Event Dispatcher",
            "WebSocket / SSE Streaming Hub"
        ], FILL_SAGE, LINE_SAGE, 520, 180, 430, 680),

        ("AI INTELLIGENCE SUBSYSTEM\n(FastAPI + Python 3.12)", [
            "LangGraph Agent Supervisor",
            "Econometric Elasticity Engine",
            "Prophet Bayesian Forecaster",
            "RAG 4-Tier Memory Controller",
            "Dual-LLM Failover Arbiter",
            "Scraper Integration Workers"
        ], FILL_BLUE, LINE_BLUE, 1000, 180, 430, 680),

        ("STORAGE & CACHE SUBSYSTEM\n(Databases & Stores)", [
            "MongoDB Atlas (12 Collections)",
            "Redis 7 (Metrics & BullMQ)",
            "ChromaDB Vector Embeddings",
            "Mongoose Schema Validation",
            "Index B-Trees & TTL Caches",
            "File System PDF Export Storage"
        ], FILL_PURPLE, LINE_PURPLE, 1480, 180, 430, 680),

        ("EXTERNAL SERVICES SUBSYSTEM\n(Third-Party Ecosystem)", [
            "Rainforest Amazon API (HTTPS)",
            "Flipkart Web Scraper (HTML)",
            "Google Gemini 2.5 Flash (REST)",
            "OpenRouter Nemotron 70B (REST)",
            "Trends / Weather / News APIs",
            "SendGrid Mailer & Google OAuth"
        ], FILL_AMBER, LINE_AMBER, 1960, 180, 400, 680),
    ]

    for title, items, fill, line, x, y, w, h in subsystems:
        sketch_rect(draw, (x, y, x + w, y + h), fill, line, 2, 14)
        # Title
        lines = title.split("\n")
        draw.text((x + 20, y + 20), lines[0], fill=line, font=get_font(18, bold=True))
        if len(lines) > 1:
            draw.text((x + 20, y + 48), lines[1], fill=INK_MUTED, font=get_font(14, bold=True))
        
        # Items
        for idx, it in enumerate(items):
            iy = y + 95 + idx * 46
            sketch_rect(draw, (x + 18, iy, x + w - 18, iy + 36), FILL_WHITE, LINE_GRAY, 1, 6)
            draw.text((x + 28, iy + 6), "▪  " + it, fill=INK, font=get_font(14))

    # Connector Buses (Horizontal Protocol Arrows)
    sketch_arrow(draw, (470, 360), (520, 360), INK, 3, "HTTPS / REST (Port 5000)")
    sketch_arrow(draw, (950, 360), (1000, 360), INK, 3, "REST RPC (Port 8000)")
    sketch_arrow(draw, (1430, 360), (1480, 360), INK, 3, "TCP / Mongo / Redis (6379)")
    sketch_arrow(draw, (1910, 360), (1960, 360), INK, 3, "HTTPS / Web APIs")

    # Lower Subsystem Details (Data Flow Matrix)
    sketch_rect(draw, (50, 720, 2350, 1340), FILL_WHITE, INK, 2, 14)
    draw.text((80, 745), "SUBSYSTEM INTERFACE SPECIFICATION & PROTOCOL MAPPING", fill=LINE_PEACH, font=get_font(22, bold=True))

    specs = [
        ("Presentation <--> Gateway", "Protocol: HTTPS / JSON  •  Auth: Authorization: Bearer <JWT>  •  Payloads: Multi-part Form, Compressed JSON  •  Latency: < 45ms"),
        ("Gateway <--> AI Microservice", "Protocol: Internal HTTP/REST  •  Serialization: Pydantic v2 Models  •  Timeout: 25s with Circuit Breaker  •  Async: BullMQ Queues"),
        ("AI Microservice <--> ChromaDB", "Protocol: HTTP / Chroma Native Client  •  Metric: Cosine Similarity  •  Collections: semantic_memory, episodic_memory  •  Embeddings: 1536-dim"),
        ("Gateway <--> MongoDB Atlas", "Protocol: Mongoose ODM over TLS/TCP  •  Port: 27017  •  Indexes: Compound SKU/UserId, Timestamp Descending  •  Replica Set: Primary-Secondary"),
        ("Gateway <--> Redis 7", "Protocol: RESP (REdis Serialization Protocol)  •  Port: 6379  •  TTL: 15m Metric Aggregates  •  Concurrency: Multi-Worker BullMQ Pool"),
        ("AI Engine <--> External APIs", "Protocol: Asynchronous HTTPX Client  •  Retries: Exponential Backoff (3 attempts)  •  Failover: Gemini 2.5 Flash -> OpenRouter Nemotron 70B")
    ]
    for idx, (sp_title, sp_desc) in enumerate(specs):
        sy = 800 + idx * 85
        sketch_rect(draw, (80, sy, 2320, sy + 70), FILL_GRAY, LINE_GRAY, 1, 8)
        draw.text((105, sy + 12), sp_title, fill=INK, font=get_font(18, bold=True))
        draw.text((105, sy + 38), sp_desc, fill=INK_MUTED, font=get_font(15))

    save_both(img, "02_system_block_diagram.png")

# ==============================================================================
# DIAGRAM 3: Main System Workflow Flowchart
# ==============================================================================
def gen_diag_03():
    W, H = 2300, 1600
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "03. Main System Workflow Flowchart", "PricePilot AI — End-to-End Operational Lifecycle & Multi-Channel Sync Pipeline")

    # Step nodes from Top to Bottom
    y = 170
    
    # 1. Start & Auth
    sketch_rect(draw, (900, y, 1400, y + 60), FILL_PEACH, LINE_PEACH, 2, 25)
    draw.text((940, y + 15), "Merchant Accesses Platform", fill=LINE_PEACH, font=get_font(20, bold=True))
    
    y += 100
    sketch_rect(draw, (850, y, 1450, y + 65), FILL_WHITE, INK, 2, 10)
    draw.text((880, y + 18), "Sign In: Google OAuth 2.0 / Salted JWT", fill=INK, font=get_font(18, bold=True))
    sketch_arrow(draw, (1150, y - 40), (1150, y), INK, 3)

    y += 105
    sketch_rect(draw, (820, y, 1480, y + 65), FILL_BLUE, LINE_BLUE, 2, 10)
    draw.text((850, y + 18), "Catalog Ingestion (Manual SKU / CSV / Shopify API)", fill=LINE_BLUE, font=get_font(18, bold=True))
    sketch_arrow(draw, (1150, y - 40), (1150, y), INK, 3)

    y += 105
    sketch_rect(draw, (840, y, 1460, y + 65), FILL_PURPLE, LINE_PURPLE, 2, 10)
    draw.text((865, y + 18), "Autonomous Background Trigger (Cron & BullMQ)", fill=LINE_PURPLE, font=get_font(18, bold=True))
    sketch_arrow(draw, (1150, y - 40), (1150, y), INK, 3)

    # 3 Parallel Streams
    y += 115
    sketch_arrow(draw, (1150, y - 50), (450, y), INK, 3, "Stream 1")
    sketch_arrow(draw, (1150, y - 50), (1150, y), INK, 3, "Stream 2")
    sketch_arrow(draw, (1150, y - 50), (1850, y), INK, 3, "Stream 3")

    sketch_rect(draw, (180, y, 720, y + 90), FILL_AMBER, LINE_AMBER, 2, 10)
    draw.text((205, y + 15), "Competitor Scraping Agent", fill=LINE_AMBER, font=get_font(18, bold=True))
    draw.text((205, y + 45), "Rainforest Amazon + Flipkart BS4 -> Clean Prices", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (880, y, 1420, y + 90), FILL_SAGE, LINE_SAGE, 2, 10)
    draw.text((910, y + 15), "Demand Telemetry Collector", fill=LINE_SAGE, font=get_font(18, bold=True))
    draw.text((910, y + 45), "Google Trends (40%) + Weather + Events + News", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (1580, y, 2120, y + 90), FILL_BLUE, LINE_BLUE, 2, 10)
    draw.text((1605, y + 15), "Sales & Velocity Aggregation", fill=LINE_BLUE, font=get_font(18, bold=True))
    draw.text((1605, y + 45), "Historical Order Rates & Rolling Margin Health", fill=INK_MUTED, font=get_font(14))

    # Converge to Optimization Pipeline
    y += 140
    sketch_arrow(draw, (450, y - 50), (1000, y), INK, 3)
    sketch_arrow(draw, (1150, y - 50), (1150, y), INK, 3)
    sketch_arrow(draw, (1850, y - 50), (1300, y), INK, 3)

    sketch_rect(draw, (650, y, 1650, y + 80), FILL_WHITE, LINE_PEACH, 3, 12)
    draw.text((700, y + 15), "AI Optimization Pipeline: Prophet Forecaster + Elasticity Engine", fill=LINE_PEACH, font=get_font(20, bold=True))
    draw.text((700, y + 45), "Bayesian 30-Day Demand Projections & Binary Search Gross Profit Maximizer P*", fill=INK_MUTED, font=get_font(15))

    # Recommendations generated
    y += 125
    sketch_rect(draw, (750, y, 1550, y + 70), FILL_AMBER, LINE_AMBER, 2, 10)
    draw.text((780, y + 20), "Generate PricingRecommendations with Explainable AI (XAI) Narrative", fill=LINE_AMBER, font=get_font(18, bold=True))
    sketch_arrow(draw, (1150, y - 45), (1150, y), INK, 3)

    # Merchant Decision Gate
    y += 120
    sketch_rect(draw, (850, y, 1450, y + 65), FILL_PEACH, LINE_PEACH, 2, 10)
    draw.text((930, y + 18), "MERCHANT DECISION GATE", fill=LINE_PEACH, font=get_font(20, bold=True))
    sketch_arrow(draw, (1150, y - 50), (1150, y), INK, 3)

    # 4 Action Branches
    y += 110
    sketch_arrow(draw, (950, y - 45), (320, y), INK, 3, "Accept")
    sketch_arrow(draw, (1080, y - 45), (850, y), INK, 3, "Simulate")
    sketch_arrow(draw, (1220, y - 45), (1450, y), INK, 3, "A/B Test")
    sketch_arrow(draw, (1350, y - 45), (1980, y), INK, 3, "Chat Copilot")

    sketch_rect(draw, (120, y, 520, y + 90), FILL_SAGE, LINE_SAGE, 2, 10)
    draw.text((150, y + 15), "Apply Recommendation", fill=LINE_SAGE, font=get_font(18, bold=True))
    draw.text((150, y + 45), "Direct catalog price update", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (650, y, 1050, y + 90), FILL_BLUE, LINE_BLUE, 2, 10)
    draw.text((680, y + 15), "What-If Simulator", fill=LINE_BLUE, font=get_font(18, bold=True))
    draw.text((680, y + 45), "Counter-move sliders & verdict", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (1250, y, 1650, y + 90), FILL_AMBER, LINE_AMBER, 2, 10)
    draw.text((1280, y + 15), "Launch A/B Experiment", fill=LINE_AMBER, font=get_font(18, bold=True))
    draw.text((1280, y + 45), "Thompson Sampling split traffic", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (1780, y, 2180, y + 90), FILL_PURPLE, LINE_PURPLE, 2, 10)
    draw.text((1810, y + 15), "Conversational Copilot", fill=LINE_PURPLE, font=get_font(18, bold=True))
    draw.text((1810, y + 45), "RAG reasoning & What-If chips", fill=INK_MUTED, font=get_font(14))

    # Multi-channel sync
    y += 140
    sketch_arrow(draw, (320, y - 50), (1000, y), INK, 3)
    sketch_arrow(draw, (850, y - 50), (1050, y), INK, 3)
    sketch_arrow(draw, (1450, y - 50), (1250, y), INK, 3)

    sketch_rect(draw, (800, y, 1500, y + 70), FILL_PEACH, LINE_PEACH, 3, 12)
    draw.text((840, y + 20), "Multi-Channel Price Sync (Amazon, Flipkart, Shopify)", fill=LINE_PEACH, font=get_font(19, bold=True))

    y += 115
    sketch_rect(draw, (750, y, 1550, y + 65), FILL_WHITE, INK, 2, 10)
    draw.text((790, y + 18), "Audit Notification Dispatched + SendGrid Digest + Continuous Loop", fill=INK, font=get_font(18, bold=True))
    sketch_arrow(draw, (1150, y - 45), (1150, y), INK, 3)

    save_both(img, "03_main_system_workflow.png")

# ==============================================================================
# DIAGRAM 4: Use Case Diagram
# ==============================================================================
def gen_diag_04():
    W, H = 2300, 1500
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "04. Use Case Diagram", "PricePilot AI — Actor Associations, Functional Boundaries & Include/Extend Specifications")

    def draw_stick_actor(draw, x, y, name, role):
        # Head
        draw.ellipse([x - 20, y - 45, x + 20, y - 5], fill=FILL_WHITE, outline=INK, width=2)
        # Body
        draw.line([(x, y - 5), (x, y + 40)], fill=INK, width=3)
        # Arms
        draw.line([(x - 30, y + 10), (x + 30, y + 10)], fill=INK, width=3)
        # Legs
        draw.line([(x, y + 40), (x - 25, y + 80)], fill=INK, width=3)
        draw.line([(x, y + 40), (x + 25, y + 80)], fill=INK, width=3)
        # Label
        font = get_font(17, bold=True)
        draw.text((x - 60, y + 90), name, fill=INK, font=font)
        draw.text((x - 50, y + 115), role, fill=INK_MUTED, font=get_font(14))

    # Left Actors
    draw_stick_actor(draw, 140, 360, "Merchant / Owner", "Primary Human Actor")
    draw_stick_actor(draw, 140, 1050, "System Admin", "Maintenance & Security")

    # Right Actors
    draw_stick_actor(draw, 2140, 360, "AI Autonomous Agent", "Background Automation")
    draw_stick_actor(draw, 2140, 1050, "Marketplaces & APIs", "External Secondary Actor")

    # System Boundary Box
    sketch_rect(draw, (340, 160, 1940, 1450), FILL_WHITE, INK, width=3, corner_r=18)
    draw.text((370, 180), "PRICEPILOT AI SYSTEM BOUNDARY", fill=LINE_PEACH, font=get_font(22, bold=True))

    use_cases = [
        ("UC-01: Authenticate via Google OAuth / JWT", 420, 240, FILL_PEACH, LINE_PEACH),
        ("UC-02: Manage Product Catalog & Cost Bounds", 1150, 240, FILL_PEACH, LINE_PEACH),
        ("UC-03: Track Live Competitor Benchmark Prices", 420, 420, FILL_AMBER, LINE_AMBER),
        ("UC-04: Ingest & Monitor Multi-Signal Demand Heatmap", 1150, 420, FILL_SAGE, LINE_SAGE),
        ("UC-05: Generate 30-Day Prophet Demand Forecasts", 420, 600, FILL_BLUE, LINE_BLUE),
        ("UC-06: Evaluate AI Pricing Recommendations & XAI", 1150, 600, FILL_PEACH, LINE_PEACH),
        ("UC-07: Simulate Pricing Scenarios (What-If Sandbox)", 420, 780, FILL_SAGE, LINE_SAGE),
        ("UC-08: Execute Price Elasticity A/B Split Testing", 1150, 780, FILL_AMBER, LINE_AMBER),
        ("UC-09: Interact with 4-Tier Memory RAG Copilot", 420, 960, FILL_PURPLE, LINE_PURPLE),
        ("UC-10: Synchronize Prices Across Sales Channels", 1150, 960, FILL_BLUE, LINE_BLUE),
        ("UC-11: Prioritize & Act on Real-Time Critical Alerts", 420, 1140, FILL_PEACH, LINE_PEACH),
        ("UC-12: Export Presentation-Ready Executive PDF Reports", 1150, 1140, FILL_WHITE, LINE_GRAY),
        ("UC-13: Scrape Marketplaces with Anti-Self-Brand Filter", 420, 1310, FILL_AMBER, LINE_AMBER),
        ("UC-14: Audit Rate Limits, Tokens & System Telemetry", 1150, 1310, FILL_GRAY, LINE_GRAY),
    ]

    uc_w, uc_h = 680, 80
    for name, x, y, fill, stroke in use_cases:
        sketch_rect(draw, (x, y, x + uc_w, y + uc_h), fill, stroke, 2, 24)
        draw.text((x + 35, y + 26), name, fill=INK, font=get_font(18, bold=True))

    # Actor Connections (Merchant to UC1-UC12)
    merchant_pos = (180, 440)
    for target_y in [280, 460, 640, 820, 1000, 1180]:
        draw.line([merchant_pos, (420, target_y)], fill=INK_MUTED, width=2)

    # Admin to UC14
    draw.line([(180, 1120), (1150, 1350)], fill=INK_MUTED, width=2)

    # AI Agent to UC3, UC4, UC5, UC6, UC10, UC13
    ai_pos = (2100, 440)
    for target_y in [460, 640, 820, 1000, 1350]:
        draw.line([ai_pos, (1830, target_y)], fill=LINE_BLUE, width=2)

    # External APIs to UC3, UC4, UC10
    ext_pos = (2100, 1120)
    for target_y in [460, 1000, 1350]:
        draw.line([ext_pos, (1830, target_y)], fill=LINE_AMBER, width=2)

    # Include / Extend Annotations
    draw.text((950, 685), "«extend»", fill=LINE_PEACH, font=get_font(14, bold=True))
    draw.line([(1150, 640), (1100, 780)], fill=LINE_PEACH, width=2)

    draw.text((950, 1045), "«include»", fill=LINE_BLUE, font=get_font(14, bold=True))
    draw.line([(1150, 820), (1150, 960)], fill=LINE_BLUE, width=2)

    draw.text((1500, 1225), "«include»", fill=LINE_GRAY, font=get_font(14, bold=True))
    draw.line([(1490, 680), (1490, 1140)], fill=LINE_GRAY, width=2)

    save_both(img, "04_use_case_diagram.png")

# ==============================================================================
# DIAGRAM 5: Data Flow Diagram (DFD)
# ==============================================================================
def gen_diag_05():
    W, H = 2500, 1500
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "05. Data Flow Diagram (DFD Level 1)", "PricePilot AI — Functional Process Decomposition, Entity Boundaries & Store Interactions")

    # External Entities (Top & Left & Right)
    sketch_rect(draw, (60, 200, 360, 300), FILL_PEACH, LINE_PEACH, 2, 8)
    draw.text((90, 230), "Merchant Client", fill=LINE_PEACH, font=get_font(20, bold=True))
    draw.text((90, 260), "Web Browser / UI", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (60, 720, 360, 820), FILL_AMBER, LINE_AMBER, 2, 8)
    draw.text((90, 750), "Marketplaces", fill=LINE_AMBER, font=get_font(20, bold=True))
    draw.text((90, 780), "Amazon & Flipkart", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (60, 1200, 360, 1300), FILL_SAGE, LINE_SAGE, 2, 8)
    draw.text((90, 1230), "Environmental APIs", fill=LINE_SAGE, font=get_font(20, bold=True))
    draw.text((90, 1260), "Trends, Weather, News", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (2100, 200, 2420, 300), FILL_BLUE, LINE_BLUE, 2, 8)
    draw.text((2130, 230), "LLM Providers", fill=LINE_BLUE, font=get_font(20, bold=True))
    draw.text((2130, 260), "Gemini & OpenRouter", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (2100, 1200, 2420, 1300), FILL_PEACH, LINE_PEACH, 2, 8)
    draw.text((2130, 1230), "Sales Channels", fill=LINE_PEACH, font=get_font(20, bold=True))
    draw.text((2130, 1260), "Shopify, Amazon, Flipkart", fill=INK_MUTED, font=get_font(14))

    # Core Processes (Numbered circles / rounded boxes)
    processes = [
        ("P1.0", "Authentication & JWT Tokenization", 500, 200, FILL_WHITE, INK),
        ("P2.0", "Catalog Management & COGS Ledger", 950, 200, FILL_WHITE, INK),
        ("P3.0", "Autonomous Competitor Scrape & Normalizer", 500, 520, FILL_AMBER, LINE_AMBER),
        ("P4.0", "Demand Telemetry Signal Fusion", 500, 840, FILL_SAGE, LINE_SAGE),
        ("P5.0", "Bayesian Prophet Time-Series Forecaster", 1000, 840, FILL_BLUE, LINE_BLUE),
        ("P6.0", "Elasticity Modeling & Profit Maximizer", 1500, 520, FILL_PEACH, LINE_PEACH),
        ("P7.0", "Interactive What-If Scenario Simulator", 1500, 200, FILL_SAGE, LINE_SAGE),
        ("P8.0", "4-Tier Memory RAG Copilot Synthesis", 1500, 840, FILL_PURPLE, LINE_PURPLE),
        ("P9.0", "Multi-Channel Price & Stock Publisher", 1500, 1200, FILL_BLUE, LINE_BLUE),
        ("P10.0", "Alert Prioritization & Event Dispatcher", 1000, 1200, FILL_PEACH, LINE_PEACH),
    ]

    pw, ph = 420, 80
    for p_id, p_name, x, y, fill, stroke in processes:
        sketch_rect(draw, (x, y, x + pw, y + ph), fill, stroke, 2, 12)
        # ID badge
        sketch_rect(draw, (x + 12, y + 16, x + 70, y + 64), stroke, stroke, 1, 6)
        draw.text((x + 18, y + 26), p_id, fill=FILL_WHITE, font=get_font(16, bold=True))
        draw.text((x + 85, y + 26), p_name, fill=INK, font=get_font(15, bold=True))

    # Data Stores (Open horizontal double bars)
    datastores = [
        ("D1: Users Collection", 520, 360, FILL_WHITE, INK),
        ("D2: Products Collection", 1020, 360, FILL_WHITE, INK),
        ("D3: CompetitorPrices Store", 520, 680, FILL_AMBER, LINE_AMBER),
        ("D4: DemandSignals Store", 520, 1000, FILL_SAGE, LINE_SAGE),
        ("D5: InventoryForecasts Store", 1020, 1000, FILL_BLUE, LINE_BLUE),
        ("D6: PricingRecommendations Store", 1520, 680, FILL_PEACH, LINE_PEACH),
        ("D7: ChromaDB Vectors", 1520, 1000, FILL_PURPLE, LINE_PURPLE),
        ("D8: Alerts Collection", 1020, 1360, FILL_PEACH, LINE_PEACH),
    ]

    dw, dh = 380, 50
    for d_name, x, y, fill, stroke in datastores:
        # Draw open-ended store lines
        draw.rectangle([x, y, x + dw, y + dh], fill=fill)
        draw.line([(x, y), (x + dw, y)], fill=stroke, width=2)
        draw.line([(x, y + dh), (x + dw, y + dh)], fill=stroke, width=2)
        draw.line([(x, y), (x, y + dh)], fill=stroke, width=2)
        draw.text((x + 20, y + 12), d_name, fill=stroke, font=get_font(16, bold=True))

    # Flow lines
    sketch_arrow(draw, (360, 240), (500, 240), INK, 2, "Credentials")
    sketch_arrow(draw, (710, 280), (710, 360), INK, 2, "Auth Tokens")
    sketch_arrow(draw, (920, 240), (950, 240), INK, 2, "Catalog Ingest")
    sketch_arrow(draw, (1160, 280), (1160, 360), INK, 2, "SKU Metadata")
    sketch_arrow(draw, (360, 760), (500, 560), LINE_AMBER, 2, "Raw Scrape")
    sketch_arrow(draw, (710, 600), (710, 680), LINE_AMBER, 2, "Price Records")
    sketch_arrow(draw, (360, 1250), (500, 880), LINE_SAGE, 2, "Telemetry")
    sketch_arrow(draw, (920, 880), (1000, 880), LINE_BLUE, 2, "Fused Signals")
    sketch_arrow(draw, (1210, 920), (1210, 1000), LINE_BLUE, 2, "30d Projections")
    sketch_arrow(draw, (1420, 560), (1500, 560), LINE_PEACH, 2, "Optimization Inputs")
    sketch_arrow(draw, (1710, 600), (1710, 680), LINE_PEACH, 2, "P* Recommendations")
    sketch_arrow(draw, (1920, 560), (2100, 260), LINE_BLUE, 2, "XAI Prompts")
    sketch_arrow(draw, (1710, 730), (1710, 840), LINE_PURPLE, 2, "Rec Insights")
    sketch_arrow(draw, (1710, 920), (1710, 1000), LINE_PURPLE, 2, "Vector Context")
    sketch_arrow(draw, (1710, 1050), (1710, 1200), LINE_BLUE, 2, "Accepted Price")
    sketch_arrow(draw, (1920, 1240), (2100, 1250), LINE_PEACH, 2, "Channel Sync Push")
    sketch_arrow(draw, (1210, 1280), (1210, 1360), LINE_PEACH, 2, "Undercuts / Stockouts")

    save_both(img, "05_data_flow_diagram_dfd.png")

# ==============================================================================
# DIAGRAM 6: Competitor Intelligence Agent Workflow
# ==============================================================================
def gen_diag_06():
    W, H = 2200, 1600
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "06. Competitor Intelligence Agent Workflow", "PricePilot AI — LangGraph StateGraph Swarm, Brand Sanitization & Live Web Scraping")

    y = 170
    sketch_rect(draw, (850, y, 1350, y + 60), FILL_PEACH, LINE_PEACH, 2, 25)
    draw.text((880, y + 15), "Product Input from Catalog", fill=LINE_PEACH, font=get_font(20, bold=True))

    nodes = [
        ("Node 1: Brand Sanitizer", "Regex engine strips store promo tags, bundle suffixes & store noise", FILL_WHITE, INK),
        ("Node 2: Generic Type Extractor", "Isolates pure product archetype (e.g. 'Wireless Earbuds', 'Edp Perfume')", FILL_WHITE, INK),
        ("Node 3: Category Taxonomy Classifier", "Maps title into standard taxonomy (Electronics, Fragrance, Home, Fashion)", FILL_WHITE, INK),
        ("Node 4: Anti-Self-Brand Filter Guardrail", "Strictly prohibits seller's own brand tokens from competitor candidate pool", FILL_PEACH, LINE_PEACH),
        ("Node 5: LLM Direct Rival Discovery", "High-reasoning prompt (Nemotron 70B / Gemini) selects 4-5 direct brand rivals", FILL_PURPLE, LINE_PURPLE),
        ("Node 6: Search Query Matrix Generator", "Synthesizes multi-query matrix: [Rival Brand] + [Generic Type] + [Key Spec]", FILL_BLUE, LINE_BLUE),
    ]

    for title, desc, fill, stroke in nodes:
        y += 105
        sketch_rect(draw, (700, y, 1500, y + 75), fill, stroke, 2, 10)
        draw.text((730, y + 12), title, fill=stroke, font=get_font(18, bold=True))
        draw.text((730, y + 40), desc, fill=INK_MUTED, font=get_font(14))
        sketch_arrow(draw, (1100, y - 30), (1100, y), INK, 3)

    # Concurrent Scraping Split
    y += 120
    sketch_arrow(draw, (1100, y - 45), (650, y), INK, 3, "Amazon")
    sketch_arrow(draw, (1100, y - 45), (1550, y), INK, 3, "Flipkart")

    sketch_rect(draw, (380, y, 920, y + 90), FILL_AMBER, LINE_AMBER, 2, 10)
    draw.text((410, y + 15), "Rainforest Amazon API Crawler", fill=LINE_AMBER, font=get_font(18, bold=True))
    draw.text((410, y + 45), "Live ASIN, BuyBox Price, Prime, Stock Status", fill=INK_MUTED, font=get_font(14))

    sketch_rect(draw, (1280, y, 1820, y + 90), FILL_AMBER, LINE_AMBER, 2, 10)
    draw.text((1310, y + 15), "Flipkart BeautifulSoup Crawler", fill=LINE_AMBER, font=get_font(18, bold=True))
    draw.text((1310, y + 45), "Live FSN, Deal Price, Rating, Stock Status", fill=INK_MUTED, font=get_font(14))

    # Converge back to Normalization
    y += 135
    sketch_arrow(draw, (650, y - 45), (1000, y), INK, 3)
    sketch_arrow(draw, (1550, y - 45), (1200, y), INK, 3)

    later_nodes = [
        ("Node 7: Price Normalizer & Outlier Truncation", "Strips currency glyphs, converts to INR, clips IQR outliers to discard accessories", FILL_WHITE, INK),
        ("Node 8: Brand-Matching Verification", "Calculates Title Similarity > 0.65; rejects unrelated bundles & zero self-matches", FILL_SAGE, LINE_SAGE),
        ("Node 9: Market Price Gravity Calculator", "Computes Median Competitor Price, Min, Max, Price Differential (ΔP), Stock Availability", FILL_BLUE, LINE_BLUE),
        ("Node 10: Explainable AI Narrative Synthesis", "Generates plain-English competitive stance narrative and elasticity inputs", FILL_PURPLE, LINE_PURPLE),
    ]
    for title, desc, fill, stroke in later_nodes:
        sketch_rect(draw, (700, y, 1500, y + 75), fill, stroke, 2, 10)
        draw.text((730, y + 12), title, fill=stroke, font=get_font(18, bold=True))
        draw.text((730, y + 40), desc, fill=INK_MUTED, font=get_font(14))
        y += 105
        sketch_arrow(draw, (1100, y - 30), (1100, y), INK, 3)

    # Output node
    sketch_rect(draw, (800, y, 1400, y + 60), FILL_PEACH, LINE_PEACH, 2, 25)
    draw.text((830, y + 15), "Persist to CompetitorPrice & Dispatch Undercut Alerts", fill=LINE_PEACH, font=get_font(18, bold=True))

    save_both(img, "06_competitor_intelligence_agent.png")

# ==============================================================================
# DIAGRAM 7: AI Pricing and What-If Simulation Workflow
# ==============================================================================
def gen_diag_07():
    W, H = 2400, 1400
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "07. AI Pricing & What-If Simulation Workflow", "PricePilot AI — Dynamic Price Elasticity (ε), Binary Search Profit Maximizer & Strategic Verdicts")

    # 4 Sequential Phase Boxes
    phases = [
        ("PHASE 1: DYNAMIC ELASTICITY ESTIMATION", [
            "Input: Category Base Elasticity (ε0)",
            "Competitor Differential: α * (P0 - Pc) / Pc",
            "Demand Multiplier Damper: β * (Dm - 0.5)",
            "Equation: ε_adj = ε0 * (1 + Diff) * (1 - Damper)",
            "Output: Category-Specific Dynamic ε_adj"
        ], FILL_PEACH, LINE_PEACH, 60, 180, 520, 500),

        ("PHASE 2: BINARY SEARCH GROSS PROFIT MAXIMIZER", [
            "Input: Base Cost (COGS), Margin Floor, Markup Cap",
            "Search Bounds: [COGS/(1-MinMargin), COGS*(1+MaxMarkup)]",
            "Demand Function: Q(P) = Q0 * (1 - ε_adj * ΔP/P0)",
            "Objective: Maximize Gross Profit = (P - COGS) * Q(P)",
            "Output: Optimal Recommended Unit Price P*"
        ], FILL_BLUE, LINE_BLUE, 640, 180, 540, 500),

        ("PHASE 3: INTERACTIVE WHAT-IF SANDBOX", [
            "Merchant Adjusts Target Price Slider",
            "Merchant Adjusts Competitor Counter-Move",
            "Merchant Injects External Demand Shock",
            "Computes Projected ΔQ (Units) & ΔRevenue",
            "Generates 20-Point Profit Frontier Curve"
        ], FILL_SAGE, LINE_SAGE, 1240, 180, 520, 500),

        ("PHASE 4: STRATEGIC VERDICT CLASSIFICATION", [
            "Evaluates Projected Revenue vs Margin Health",
            "Margin Maximizer (ΔProfit > 0, Margin Rises)",
            "Market Share Grab (ΔQ > 0, Undercuts Rivals)",
            "Margin Risk (Violates Floor Margin)",
            "Volume Risk (Excessive Markup Drops Volume)"
        ], FILL_AMBER, LINE_AMBER, 1820, 180, 520, 500),
    ]

    for title, items, fill, stroke, x, y, w, h in phases:
        sketch_rect(draw, (x, y, x + w, y + h), fill, stroke, 2, 14)
        draw.text((x + 20, y + 25), title, fill=stroke, font=get_font(18, bold=True))
        for line_i, it in enumerate(items):
            iy = y + 90 + line_i * 65
            sketch_rect(draw, (x + 18, iy, x + w - 18, iy + 48), FILL_WHITE, LINE_GRAY, 1, 8)
            draw.text((x + 30, iy + 12), "▪  " + it, fill=INK, font=get_font(15))

    # Flow arrows across phases
    sketch_arrow(draw, (580, 420), (640, 420), INK, 3)
    sketch_arrow(draw, (1180, 420), (1240, 420), INK, 3)
    sketch_arrow(draw, (1760, 420), (1820, 420), INK, 3)

    # Lower Section: Strategic Verdict Badge Showcase & Decision Deployment
    sketch_rect(draw, (60, 720, 2280, 1340), FILL_WHITE, INK, 2, 14)
    draw.text((90, 745), "WHAT-IF SIMULATOR DECISION ACTIONS & EXECUTION GATES", fill=LINE_PEACH, font=get_font(22, bold=True))

    verdicts = [
        ("MARGIN MAXIMIZER", "Safe price lift for inelastic goods. Expands gross margin % with negligible drop in unit volume.", FILL_SAGE, LINE_SAGE),
        ("MARKET SHARE GRAB", "Strategic undercut pricing. Sacrifices unit margin points to capture dominant category volume.", FILL_BLUE, LINE_BLUE),
        ("MARGIN RISK WARNING", "Alert: proposed price point breaches required COGS margin floor. Subsidizes unprofitable orders.", FILL_PEACH, LINE_PEACH),
        ("VOLUME COLLAPSE RISK", "Alert: excessive price differential relative to Amazon/Flipkart rivals causes immediate demand drop.", FILL_AMBER, LINE_AMBER),
    ]
    vw = 510
    for v_i, (v_badge, v_desc, v_fill, v_line) in enumerate(verdicts):
        vx = 90 + v_i * (vw + 35)
        sketch_rect(draw, (vx, 810, vx + vw, 1020), v_fill, v_line, 2, 10)
        draw.text((vx + 20, 835), v_badge, fill=v_line, font=get_font(18, bold=True))
        draw.text((vx + 20, 885), v_desc, fill=INK, font=get_font(15))

    # Commit options
    decisions = [
        ("Action A: Commit to Catalog", "Applies simulated price immediately to MongoDB and updates product catalog baseline.", FILL_WHITE, LINE_PEACH, 90),
        ("Action B: Multi-Channel Publish", "Pushes new price to Amazon, Flipkart, and Shopify stores with a single confirmation click.", FILL_WHITE, LINE_SAGE, 840),
        ("Action C: Deploy A/B Experiment", "Splits traffic 50/50 between Control and AI variant using Thompson Sampling bandit.", FILL_WHITE, LINE_BLUE, 1590),
    ]
    for act_title, act_desc, a_fill, a_line, ax in decisions:
        sketch_rect(draw, (ax, 1070, ax + 700, 1290), a_fill, a_line, 2, 10)
        draw.text((ax + 25, 1100), act_title, fill=a_line, font=get_font(19, bold=True))
        draw.text((ax + 25, 1150), act_desc, fill=INK, font=get_font(15))

    save_both(img, "07_ai_pricing_what_if_simulation.png")

# ==============================================================================
# DIAGRAM 8: Demand Forecasting Workflow
# ==============================================================================
def gen_diag_08():
    W, H = 2400, 1400
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "08. Demand Forecasting Workflow", "PricePilot AI — Multi-Signal Telemetry Fusion, Facebook Prophet Time-Series & Reorder Alerts")

    # 1. Telemetry Ingestion Boxes (Left)
    sketch_rect(draw, (60, 180, 520, 720), FILL_WHITE, LINE_SAGE, 2, 14)
    draw.text((85, 205), "1. ENVIRONMENTAL TELEMETRY", fill=LINE_SAGE, font=get_font(20, bold=True))

    telemetry = [
        ("Google Trends API", "Keyword search volume (0-100)", "Weight: 40%", FILL_BLUE, LINE_BLUE),
        ("OpenWeatherMap API", "Temperature & rain index (-1 to +1)", "Weight: 20%", FILL_SAGE, LINE_SAGE),
        ("Eventbrite Events API", "Local holiday & festival density", "Weight: 20%", FILL_AMBER, LINE_AMBER),
        ("NewsAPI Sentiment NLP", "Market polarity sentiment score", "Weight: 20%", FILL_PURPLE, LINE_PURPLE),
    ]
    for idx, (t_name, t_sub, t_wt, t_fill, t_stroke) in enumerate(telemetry):
        ty = 260 + idx * 105
        sketch_rect(draw, (85, ty, 495, ty + 85), t_fill, t_stroke, 1, 8)
        draw.text((105, ty + 12), t_name, fill=INK, font=get_font(16, bold=True))
        draw.text((105, ty + 38), t_sub, fill=INK_MUTED, font=get_font(13))
        draw.text((360, ty + 12), t_wt, fill=t_stroke, font=get_font(14, bold=True))

    # 2. Composite Demand Fusion
    sketch_arrow(draw, (520, 450), (620, 450), INK, 3)
    sketch_rect(draw, (620, 180, 1140, 720), FILL_WHITE, LINE_PEACH, 2, 14)
    draw.text((645, 205), "2. SIGNAL NORMALIZATION & FUSION", fill=LINE_PEACH, font=get_font(20, bold=True))

    fusion_steps = [
        ("Factor Normalization", "Maps raw metrics into standardized [0, 100] scale:\nNormalized = ((Raw_Factor + 1) / 2) * 100"),
        ("Weighted Composite Equation", "Score = (0.40 * Trends) + (0.20 * Weather)\n        + (0.20 * Events) + (0.20 * Sentiment)"),
        ("Historical Order Velocity", "30-day trailing daily order volume from DailySalesMetric collection"),
        ("Model Selection Gate", "If N >= 30 Days -> Ingest into Facebook Prophet\nIf N < 30 Days -> Fallback to Holt-Winters / Moving Average")
    ]
    for idx, (f_title, f_desc) in enumerate(fusion_steps):
        fy = 260 + idx * 105
        sketch_rect(draw, (645, fy, 1115, fy + 85), FILL_PEACH, LINE_PEACH, 1, 8)
        draw.text((665, fy + 12), f_title, fill=LINE_PEACH, font=get_font(16, bold=True))
        for l_i, l_txt in enumerate(f_desc.split("\n")):
            draw.text((665, fy + 38 + l_i * 20), l_txt, fill=INK_MUTED, font=get_font(13))

    # 3. Prophet Model Architecture
    sketch_arrow(draw, (1140, 450), (1240, 450), INK, 3)
    sketch_rect(draw, (1240, 180, 1780, 720), FILL_WHITE, LINE_BLUE, 2, 14)
    draw.text((1265, 205), "3. PROPHET TIME-SERIES DECOMPOSITION", fill=LINE_BLUE, font=get_font(20, bold=True))

    prophet_comps = [
        ("Trend Component g(t)", "Piecewise linear growth model with automatic changepoint detection"),
        ("Seasonality Component s(t)", "Fourier series capturing weekly (order 3) and monthly cycles"),
        ("Holiday Component h(t)", "Custom calendar effects (Diwali, Prime Day, Cyber Monday)"),
        ("External Regressor β*x(t)", "Injected daily Composite Demand Score telemetry (0-100)"),
    ]
    for idx, (p_title, p_desc) in enumerate(prophet_comps):
        py = 260 + idx * 105
        sketch_rect(draw, (1265, py, 1755, py + 85), FILL_BLUE, LINE_BLUE, 1, 8)
        draw.text((1285, py + 12), p_title, fill=LINE_BLUE, font=get_font(16, bold=True))
        draw.text((1285, py + 38), p_desc, fill=INK_MUTED, font=get_font(13))

    # 4. Forecast Output & Inventory Intelligence (Right)
    sketch_arrow(draw, (1780, 450), (1860, 450), INK, 3)
    sketch_rect(draw, (1860, 180, 2340, 720), FILL_WHITE, LINE_AMBER, 2, 14)
    draw.text((1885, 205), "4. INVENTORY HEALTH & REORDER", fill=LINE_AMBER, font=get_font(20, bold=True))

    inv_cards = [
        ("30-Day Projections", "Daily point estimate demand with 70% and 95% Bayesian confidence intervals", FILL_WHITE, LINE_GRAY),
        ("Stock Depletion Rate", "Stock(t) = CurrentStock - Sum(DailyDemand)", FILL_WHITE, LINE_GRAY),
        ("Stockout Runway", "Days until stock depletion reaches zero under projected velocity", FILL_WHITE, LINE_GRAY),
        ("Optimal Reorder Quantity", "Reorder = (DailyDemand * LeadTime) + SafetyStock - CurrentStock", FILL_WHITE, LINE_GRAY),
    ]
    for idx, (i_title, i_desc, i_fill, i_line) in enumerate(inv_cards):
        iy = 260 + idx * 105
        sketch_rect(draw, (1885, iy, 2315, iy + 85), i_fill, i_line, 1, 8)
        draw.text((1905, iy + 12), i_title, fill=LINE_AMBER, font=get_font(16, bold=True))
        draw.text((1905, iy + 38), i_desc, fill=INK_MUTED, font=get_font(13))

    # Bottom Timeline & Forecast Display
    sketch_rect(draw, (60, 760, 2340, 1340), FILL_WHITE, INK, 2, 14)
    draw.text((90, 790), "FORECAST EXECUTION TIMELINE & REORDER AUTOMATION PIPELINE", fill=LINE_PEACH, font=get_font(22, bold=True))

    timeline_steps = [
        ("00:00 UTC Daily Ingestion", "Node-cron triggers bulk sales history pull and environmental API query for all active SKUs."),
        ("Bayesian Fitting Pipeline", "FastAPI runs Prophet regressor in parallel worker processes, fitting seasonality changepoints."),
        ("Confidence Band Extraction", "Calculates upper and lower posterior predictive intervals (yhat_upper, yhat_lower)."),
        ("Runway Threshold Evaluation", "Compares runway against supplier lead time. If Runway <= LeadTime + 7, triggers High-Severity Alert."),
        ("Recharts Dashboard Render", "Visualizes interactive area chart showing projected depletion curve against reorder threshold.")
    ]
    for idx, (t_title, t_desc) in enumerate(timeline_steps):
        ty = 850 + idx * 90
        sketch_rect(draw, (90, ty, 2310, ty + 70), FILL_GRAY, LINE_GRAY, 1, 8)
        draw.text((120, ty + 12), t_title, fill=INK, font=get_font(18, bold=True))
        draw.text((120, ty + 38), t_desc, fill=INK_MUTED, font=get_font(15))

    save_both(img, "08_demand_forecasting_workflow.png")

# ==============================================================================
# DIAGRAM 9: RAG Conversational AI Workflow
# ==============================================================================
def gen_diag_09():
    W, H = 2400, 1400
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "09. RAG Conversational AI Workflow", "PricePilot AI — 4-Tier Cognitive Memory Architecture & Multi-Tier Resilient LLM Routing")

    # Left: User Input Layer
    sketch_rect(draw, (60, 180, 520, 720), FILL_WHITE, LINE_PEACH, 2, 14)
    draw.text((85, 205), "1. MERCHANT QUERY INGESTION", fill=LINE_PEACH, font=get_font(20, bold=True))

    query_boxes = [
        ("Freeform Conversational Query", "Questions regarding margin strategy, competitor counter-moves, elasticity"),
        ("Slash Commands", "/what-if, /explain-simply, /analyze-competitors, /demand-signals"),
        ("Inline @Product Chips", "Type '@' to inject active SKU, COGS, Stock, and Real-Time Competitor median"),
        ("Session Context", "Sliding window of last 6 conversational turns preserved in local state"),
    ]
    for idx, (q_title, q_desc) in enumerate(query_boxes):
        qy = 260 + idx * 105
        sketch_rect(draw, (85, qy, 495, qy + 85), FILL_PEACH, LINE_PEACH, 1, 8)
        draw.text((105, qy + 12), q_title, fill=LINE_PEACH, font=get_font(16, bold=True))
        draw.text((105, qy + 38), q_desc, fill=INK_MUTED, font=get_font(13))

    sketch_arrow(draw, (520, 450), (620, 450), INK, 3)

    # Middle Left: 4-Tier Memory Controller
    sketch_rect(draw, (620, 180, 1200, 720), FILL_WHITE, LINE_PURPLE, 2, 14)
    draw.text((645, 205), "2. 4-TIER COGNITIVE MEMORY RETRIEVAL", fill=LINE_PURPLE, font=get_font(20, bold=True))

    memory_tiers = [
        ("Tier 1: Ephemeral Working Memory", "RAM context window: System Persona + Active SKU Specs + Live Competitor Median"),
        ("Tier 2: Semantic Memory (ChromaDB)", "Cosine top-k search on catalog specs, return rules, store margin policies"),
        ("Tier 3: Episodic Memory (ChromaDB)", "Cosine top-k search on past merchant conversations, confirmed price actions"),
        ("Tier 4: Procedural Memory", "Algorithmic decision rules, elasticity calculations, and pricing playbooks"),
    ]
    for idx, (m_title, m_desc) in enumerate(memory_tiers):
        my = 260 + idx * 105
        sketch_rect(draw, (645, my, 1175, my + 85), FILL_PURPLE, LINE_PURPLE, 1, 8)
        draw.text((665, my + 12), m_title, fill=LINE_PURPLE, font=get_font(16, bold=True))
        draw.text((665, my + 38), m_desc, fill=INK_MUTED, font=get_font(13))

    sketch_arrow(draw, (1200, 450), (1300, 450), INK, 3)

    # Middle Right: Multi-Tier Resilient LLM Router
    sketch_rect(draw, (1300, 180, 1800, 720), FILL_WHITE, LINE_BLUE, 2, 14)
    draw.text((1325, 205), "3. DUAL-TIER LLM ROUTER", fill=LINE_BLUE, font=get_font(20, bold=True))

    llm_tiers = [
        ("Primary Engine: Google Gemini 2.5 Flash", "1M context window, < 800ms time-to-first-token. Generates XAI explanations."),
        ("Fallback Engine: OpenRouter Nemotron 70B", "Triggered on Gemini 429 (Rate Limit) or 503 (Overloaded) with zero loss of reasoning."),
        ("Safety Net: Deterministic Rule Engine", "Local rule-based fallback if all external cloud APIs are offline."),
        ("Action Payload Extractor", "Detects scenario parameters and synthesizes structured What-If action JSON."),
    ]
    for idx, (l_title, l_desc) in enumerate(llm_tiers):
        ly = 260 + idx * 105
        sketch_rect(draw, (1325, ly, 1775, ly + 85), FILL_BLUE, LINE_BLUE, 1, 8)
        draw.text((1345, ly + 12), l_title, fill=LINE_BLUE, font=get_font(16, bold=True))
        draw.text((1345, ly + 38), l_desc, fill=INK_MUTED, font=get_font(13))

    sketch_arrow(draw, (1800, 450), (1880, 450), INK, 3)

    # Right: Response Synthesis & Executable Cards
    sketch_rect(draw, (1880, 180, 2340, 720), FILL_WHITE, LINE_SAGE, 2, 14)
    draw.text((1905, 205), "4. EXECUTABLE ARTIFACTS", fill=LINE_SAGE, font=get_font(20, bold=True))

    output_cards = [
        ("Markdown Advisory Narrative", "Plain-English econometric decision analysis formatted with code and equations"),
        ("Executable What-If Scenario Card", "Clickable card pre-populating target price, competitor response & margin sliders"),
        ("One-Click Simulator Launcher", "Directly launches WhatIfSimulator modal with parameters from conversation"),
        ("Async Memory Writeback", "Turn and merchant reaction asynchronously saved to ChromaDB Episodic Memory"),
    ]
    for idx, (o_title, o_desc) in enumerate(output_cards):
        oy = 260 + idx * 105
        sketch_rect(draw, (1905, oy, 2315, oy + 85), FILL_SAGE, LINE_SAGE, 1, 8)
        draw.text((1925, oy + 12), o_title, fill=LINE_SAGE, font=get_font(16, bold=True))
        draw.text((1925, oy + 38), o_desc, fill=INK_MUTED, font=get_font(13))

    # Bottom Architecture Details (Context Synthesis Flow)
    sketch_rect(draw, (60, 760, 2340, 1340), FILL_WHITE, INK, 2, 14)
    draw.text((90, 790), "4-TIER MEMORY SYNTHESIS MATRIX & CONTINUOUS LEARNING LOOP", fill=LINE_PURPLE, font=get_font(22, bold=True))

    rag_specs = [
        ("Step 1: Context Assembly", "Combines System Persona, Sliding Chat Turns, Active SKU Specs, Competitor Benchmark Prices."),
        ("Step 2: Vector Embedding & Search", "Query vector embedded with cosine similarity top-k search against ChromaDB Semantic & Episodic collections."),
        ("Step 3: Prompt Fusion", "Synthesizes structured multi-section prompt payload injected with mathematical margin formulas."),
        ("Step 4: LLM Response & Action Parsing", "Parses natural language advice and extracts JSON parameters: { proposed_price, competitor_delta, demand_multiplier }."),
        ("Step 5: Async Episodic Persistence", "Fire-and-forget async worker appends dialogue to ChromaDB Episodic collection for persistent context retention.")
    ]
    for idx, (r_title, r_desc) in enumerate(rag_specs):
        ry = 850 + idx * 90
        sketch_rect(draw, (90, ry, 2310, ry + 70), FILL_GRAY, LINE_GRAY, 1, 8)
        draw.text((120, ry + 12), r_title, fill=INK, font=get_font(18, bold=True))
        draw.text((120, ry + 38), r_desc, fill=INK_MUTED, font=get_font(15))

    save_both(img, "09_rag_conversational_ai_workflow.png")

# ==============================================================================
# DIAGRAM 10: Database Design / Collection Relationship Diagram
# ==============================================================================
def gen_diag_10():
    W, H = 2500, 1600
    img = Image.new("RGB", (W, H), CANVAS_BG)
    draw = ImageDraw.Draw(img)
    draw_header(draw, W, "10. Database Design / Collection Relationship Diagram", "PricePilot AI — MongoDB Atlas Mongoose Schema Architecture, Indexes & 1:N / 1:1 Relationships")

    # 12 Collections arranged in 3 rows x 4 columns
    collections = [
        # Row 1
        ("USER (Core Merchant)", [
            "_id: ObjectId (PK)",
            "name: String",
            "email: String (UK)",
            "password: String (Bcrypt)",
            "role: String ('admin' | 'user')",
            "storeName: String",
            "preferences: Object (theme, margin)",
            "onboarding: Object (goals, channels)",
            "createdAt / updatedAt: Date"
        ], FILL_PEACH, LINE_PEACH, 50, 180),

        ("PRODUCT (Catalog)", [
            "_id: ObjectId (PK)",
            "userId: ObjectId (FK -> User)",
            "name: String",
            "sku: String (UK per User)",
            "category: String",
            "baseCost: Number (COGS)",
            "currentPrice: Number",
            "minMargin: Number (Def 0.10)",
            "stockLevel: Number",
            "reorderThreshold: Number"
        ], FILL_SAGE, LINE_SAGE, 660, 180),

        ("COMPETITOR_PRICE", [
            "_id: ObjectId (PK)",
            "productId: ObjectId (FK -> Product)",
            "competitorName: String",
            "productName: String",
            "competitorPrice: Number",
            "competitorUrl: String",
            "inStock: Boolean",
            "timestamp: Date"
        ], FILL_AMBER, LINE_AMBER, 1270, 180),

        ("DEMAND_SIGNAL", [
            "_id: ObjectId (PK)",
            "productId: ObjectId (FK -> Product)",
            "searchTrendScore: Number (0-100)",
            "weatherFactor: Number (-1 to 1)",
            "eventFactor: Number (-1 to 1)",
            "socialSentimentScore: Number (-1 to 1)",
            "compositeDemandScore: Number (0-100)",
            "timestamp: Date"
        ], FILL_PURPLE, LINE_PURPLE, 1880, 180),

        # Row 2
        ("PRICING_RECOMMENDATION", [
            "_id: ObjectId (PK)",
            "productId: ObjectId (FK -> Product)",
            "userId: ObjectId (FK -> User)",
            "recommendedPrice: Number",
            "currentPrice: Number",
            "reason: String (XAI Narrative)",
            "expectedRevenueImpact: Number (%)",
            "confidenceScore: Number (0 to 1)",
            "status: String ('pending' | 'accepted')",
            "elasticityUsed: Number"
        ], FILL_PEACH, LINE_PEACH, 50, 640),

        ("INVENTORY_FORECAST", [
            "_id: ObjectId (PK)",
            "productId: ObjectId (FK -> Product)",
            "userId: ObjectId (FK -> User)",
            "predictedDemand: Number",
            "recommendedStockIncrease: Number",
            "currentStock: Number",
            "forecastRange: Number (30 days)",
            "confidenceScore: Number (0 to 1)",
            "reason: String",
            "timestamp: Date"
        ], FILL_BLUE, LINE_BLUE, 660, 640),

        ("AB_TEST", [
            "_id: ObjectId (PK)",
            "productId: ObjectId (FK -> Product)",
            "userId: ObjectId (FK -> User)",
            "recommendationId: ObjectId (FK)",
            "variantA: Object (price, label)",
            "variantB: Object (price, label)",
            "status: String ('active' | 'completed')",
            "results: Object (views, conversions)",
            "winner: String ('A' | 'B' | 'tie')"
        ], FILL_AMBER, LINE_AMBER, 1270, 640),

        ("ALERT", [
            "_id: ObjectId (PK)",
            "productId: ObjectId (FK -> Product)",
            "userId: ObjectId (FK -> User)",
            "type: String (undercut, stockout)",
            "severity: String ('low' | 'high')",
            "title: String",
            "message: String",
            "read: Boolean",
            "actionTaken: Boolean",
            "timestamp: Date"
        ], FILL_PEACH, LINE_PEACH, 1880, 640),

        # Row 3
        ("PRODUCT_MAPPING (Channels)", [
            "_id: ObjectId (PK)",
            "productId: ObjectId (FK -> Product)",
            "channel: String (shopify, amazon)",
            "channelProductId: String",
            "channelSku: String",
            "isSynced: Boolean",
            "lastSyncedAt: Date"
        ], FILL_BLUE, LINE_BLUE, 50, 1100),

        ("DAILY_SALES_METRIC", [
            "_id: ObjectId (PK)",
            "productId: ObjectId (FK -> Product)",
            "date: Date",
            "unitsSold: Number",
            "revenue: Number",
            "avgSellingPrice: Number"
        ], FILL_SAGE, LINE_SAGE, 660, 1100),

        ("CHAT_SESSION", [
            "_id: ObjectId (PK)",
            "userId: ObjectId (FK -> User)",
            "messages: Array (role, content)",
            "activeProductContext: ObjectId (FK)",
            "timestamp: Date"
        ], FILL_PURPLE, LINE_PURPLE, 1270, 1100),

        ("PLATFORM_FEEDBACK", [
            "_id: ObjectId (PK)",
            "userId: ObjectId (FK -> User)",
            "type: String ('bug' | 'feature')",
            "rating: Number (1 to 5)",
            "comment: String",
            "systemTelemetry: Object",
            "createdAt: Date"
        ], FILL_GRAY, LINE_GRAY, 1880, 1100),
    ]

    cw, ch = 570, 410
    for title, fields, fill, line, x, y in collections:
        sketch_rect(draw, (x, y, x + cw, y + ch), fill, line, 2, 12)
        # Header bar
        sketch_rect(draw, (x, y, x + cw, y + 48), line, line, 1, 12)
        draw.text((x + 18, y + 12), title, fill=FILL_WHITE, font=get_font(18, bold=True))
        
        # Field list
        for f_idx, field in enumerate(fields):
            draw.text((x + 20, y + 62 + f_idx * 35), "•  " + field, fill=INK, font=get_font(15))

    # Relationships (Lines connecting entities with labels)
    # User owns Product (1:N)
    sketch_arrow(draw, (620, 240), (660, 240), INK, 3, "1:N")
    # Product tracked against CompetitorPrice (1:N)
    sketch_arrow(draw, (1230, 240), (1270, 240), INK, 3, "1:N")
    # Product measures DemandSignal (1:N)
    sketch_arrow(draw, (1840, 240), (1880, 240), INK, 3, "1:N")

    # Product -> PricingRecommendation (1:N)
    sketch_arrow(draw, (750, 590), (350, 640), INK, 3, "1:N")
    # Product -> InventoryForecast (1:N)
    sketch_arrow(draw, (950, 590), (950, 640), INK, 3, "1:N")
    # PricingRecommendation -> AB_Test (1:1)
    sketch_arrow(draw, (620, 720), (1270, 720), INK, 3, "1:1 Validates")

    # Product -> ProductMapping (1:N)
    sketch_arrow(draw, (750, 1050), (350, 1100), INK, 3, "1:N")
    # Product -> DailySalesMetric (1:N)
    sketch_arrow(draw, (950, 1050), (950, 1100), INK, 3, "1:N")

    save_both(img, "10_database_er_diagram.png")

# Run all generators
if __name__ == "__main__":
    print("Generating all 10 Excalidraw-style Architecture Diagrams...")
    gen_diag_01()
    gen_diag_02()
    gen_diag_03()
    gen_diag_04()
    gen_diag_05()
    gen_diag_06()
    gen_diag_07()
    gen_diag_08()
    gen_diag_09()
    gen_diag_10()
    print("All 10 diagrams generated successfully!")
