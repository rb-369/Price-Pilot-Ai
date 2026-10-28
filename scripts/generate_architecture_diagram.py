"""
Generate a clean, high-resolution System Architecture Diagram for PricePilot AI
matching the website's light/warm pearl color theme (#F6F3ED, #FFFFFF, #A85A3C, #466352, #C49B55).
Output: docs/ppt/assets/architecture_light_theme.png
"""

import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    # Try common Windows fonts
    font_names = [
        "C:\\Windows\\Fonts\\segoeui.ttf" if not bold else "C:\\Windows\\Fonts\\segoeuib.ttf",
        "C:\\Windows\\Fonts\\arial.ttf" if not bold else "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\calibri.ttf" if not bold else "C:\\Windows\\Fonts\\calibrib.ttf",
    ]
    for fn in font_names:
        if os.path.exists(fn):
            try:
                return ImageFont.truetype(fn, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_rounded_rect(draw, bbox, radius, fill, outline, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

def draw_arrow_down(draw, x, y1, y2, color, label=""):
    draw.line([(x, y1), (x, y2)], fill=color, width=3)
    # arrow head
    draw.polygon([(x - 7, y2 - 10), (x + 7, y2 - 10), (x, y2)], fill=color)
    if label:
        font = get_font(18, bold=True)
        draw.text((x + 12, (y1 + y2) // 2 - 10), label, fill=color, font=font)

def draw_arrow_right(draw, x1, x2, y, color, label=""):
    draw.line([(x1, y), (x2, y)], fill=color, width=3)
    draw.polygon([(x2 - 10, y - 7), (x2 - 10, y + 7), (x2, y)], fill=color)
    if label:
        font = get_font(15, bold=True)
        bbox = draw.textbbox((0, 0), label, font=font)
        tw = bbox[2] - bbox[0]
        tx = (x1 + x2 - tw) // 2
        draw.text((tx, y - 22), label, fill=color, font=font)

def generate_diagram():
    os.makedirs("docs/ppt/assets", exist_ok=True)
    out_path = "docs/ppt/assets/architecture_light_theme.png"

    W, H = 2600, 1600
    img = Image.new("RGB", (W, H), (246, 243, 237))  # #F6F3ED Warm Pearl
    draw = ImageDraw.Draw(img)

    # Color definitions
    C_WHITE     = (255, 255, 255)
    C_BORDER    = (218, 210, 198)
    C_TERRA     = (168, 90, 60)     # #A85A3C Primary Terracotta
    C_DEEP_TERRA= (140, 70, 48)     # #8C4630 Deep Terracotta
    C_SAGE      = (70, 99, 82)      # #466352 Sage Green
    C_BRASS     = (196, 155, 85)    # #C49B55 Brass / Gold
    C_ESPRESSO  = (36, 24, 18)      # #241812 Dark Espresso
    C_WALNUT    = (88, 75, 67)      # #584B43 Walnut Text
    C_MUTED     = (130, 118, 108)
    C_PILL_BG   = (250, 247, 242)   # Pearl Pill BG
    C_PILL_BRD  = (226, 219, 208)

    # Header Banner
    draw_rounded_rect(draw, (60, 40, W - 60, 140), 16, C_WHITE, C_BORDER, 2)
    font_logo = get_font(38, bold=True)
    font_sub = get_font(20, bold=False)
    draw.text((90, 58), "PricePilot AI", fill=C_TERRA, font=font_logo)
    draw.text((340, 68), "— System Architecture: Decoupled 3-Tier Enterprise Topology", fill=C_ESPRESSO, font=get_font(28, bold=True))
    draw.text((90, 102), "Autonomous Multi-Channel Revenue Optimization  •  React 19  •  Node.js 20 Gateway  •  FastAPI Microservice", fill=C_WALNUT, font=font_sub)

    # Layout coordinates
    main_w = 1700
    main_x = 60
    ext_x = 1880
    ext_w = 660

    # ─────────────────────────────────────────────────────────
    # TIER 1: FRONTEND (React Client)
    # ─────────────────────────────────────────────────────────
    t1_y1, t1_y2 = 180, 560
    draw_rounded_rect(draw, (main_x, t1_y1, main_x + main_w, t1_y2), 16, C_WHITE, C_TERRA, 2)
    
    # Tier 1 Title Bar
    draw_rounded_rect(draw, (main_x + 20, t1_y1 + 18, main_x + 440, t1_y1 + 62), 10, (248, 238, 233), C_TERRA, 1)
    draw.text((main_x + 35, t1_y1 + 25), "1  FRONTEND CLIENT TIER", fill=C_TERRA, font=get_font(20, bold=True))
    draw.text((main_x + 480, t1_y1 + 27), "React 19  •  Vite 7  •  Tailwind CSS 4  •  Recharts  •  Axios Client", fill=C_WALNUT, font=get_font(20, bold=True))

    # Tier 1 Chips / Modules
    frontend_chips = [
        ("Landing Page", "Stacking Card Motion"),
        ("Executive Dashboard", "Sales & Stock Velocity"),
        ("Products Catalog", "COGS & MSRP Management"),
        ("Competitor Radar", "Real-Time Market Prices"),
        ("Demand Signals", "Weather / News / Trends"),
        ("30-Day Forecasts", "Prophet Time-Series"),
        ("AI Recommendations", "Elasticity & Profit Margin"),
        ("What-If Simulator", "Profit Frontier Curves"),
        ("AI Chatbot Copilot", "RAG + @Product Chips"),
        ("Alerts Center", "Stockout Risk Warnings"),
        ("A/B Testing", "Multi-Armed Bandit"),
        ("Universal Search", "Cmd+K Command Palette")
    ]
    chip_w = 265
    chip_h = 68
    start_cx = main_x + 30
    start_cy = t1_y1 + 85
    for i, (name, desc) in enumerate(frontend_chips):
        col = i % 6
        row = i // 6
        cx = start_cx + col * (chip_w + 24)
        cy = start_cy + row * (chip_h + 18)
        draw_rounded_rect(draw, (cx, cy, cx + chip_w, cy + chip_h), 8, C_PILL_BG, C_PILL_BRD, 1)
        draw.text((cx + 12, cy + 10), name, fill=C_ESPRESSO, font=get_font(17, bold=True))
        draw.text((cx + 12, cy + 36), desc, fill=C_WALNUT, font=get_font(14, bold=False))

    # Connector 1 -> 2
    draw_arrow_down(draw, main_x + 450, t1_y2, t1_y2 + 80, C_TERRA, "HTTPS / JWT Bearer (REST APIs)")

    # ─────────────────────────────────────────────────────────
    # TIER 2: BACKEND (Node.js API Gateway)
    # ─────────────────────────────────────────────────────────
    t2_y1, t2_y2 = 640, 1040
    draw_rounded_rect(draw, (main_x, t2_y1, main_x + main_w, t2_y2), 16, C_WHITE, C_SAGE, 2)

    # Tier 2 Title Bar
    draw_rounded_rect(draw, (main_x + 20, t2_y1 + 18, main_x + 440, t2_y1 + 62), 10, (235, 242, 237), C_SAGE, 1)
    draw.text((main_x + 35, t2_y1 + 25), "2  BACKEND API GATEWAY", fill=C_SAGE, font=get_font(20, bold=True))
    draw.text((main_x + 480, t2_y1 + 27), "Node.js 20  •  Express 4  •  MongoDB Atlas  •  Redis 7 Cache  •  BullMQ Queues", fill=C_WALNUT, font=get_font(20, bold=True))

    # Inner Sub-Boxes for Gateway
    # Box A: API Routes
    box_a_w = 530
    draw_rounded_rect(draw, (main_x + 30, t2_y1 + 80, main_x + 30 + box_a_w, t2_y2 - 25), 10, C_PILL_BG, C_PILL_BRD, 1)
    draw.text((main_x + 48, t2_y1 + 95), "EXPRESS API ROUTE GROUPS", fill=C_SAGE, font=get_font(18, bold=True))
    routes = [
        ("POST /api/auth", "Google OAuth & JWT Sessions"),
        ("GET/POST /api/products", "SKU & Catalog Ingestion"),
        ("GET /api/competitors", "Scraped Price Telemetry"),
        ("GET /api/demand", "Composite Demand Multipliers"),
        ("POST /api/ai/pricing", "Optimal Price Recommendations"),
        ("POST /api/chat", "RAG Streaming Copilot (SSE)"),
        ("POST /api/simulator", "What-If Scenario Execution")
    ]
    for r_i, (r_name, r_desc) in enumerate(routes):
        ry = t2_y1 + 130 + r_i * 37
        draw.text((main_x + 48, ry), r_name, fill=C_ESPRESSO, font=get_font(15, bold=True))
        draw.text((main_x + 270, ry), r_desc, fill=C_WALNUT, font=get_font(14, bold=False))

    # Box B: Defensive Security Middleware
    box_b_x = main_x + 30 + box_a_w + 25
    box_b_w = 530
    draw_rounded_rect(draw, (box_b_x, t2_y1 + 80, box_b_x + box_b_w, t2_y2 - 25), 10, C_PILL_BG, C_PILL_BRD, 1)
    draw.text((box_b_x + 18, t2_y1 + 95), "DEFENSIVE MIDDLEWARE & SECURITY", fill=C_SAGE, font=get_font(18, bold=True))
    middleware = [
        ("JWT Auth Verification", "Bcrypt hashed token validation"),
        ("express-rate-limit", "DDoS & API throttling protection"),
        ("Helmet Security Headers", "X-Frame-Options, CSP, HSTS"),
        ("express-mongo-sanitize", "NoSQL injection sanitization"),
        ("xss-clean Sanitizer", "Cross-site scripting filter"),
        ("CORS Whitelist Policy", "Origin protection for frontend"),
        ("Global Error Boundary", "Centralized status code handler")
    ]
    for m_i, (m_name, m_desc) in enumerate(middleware):
        my = t2_y1 + 130 + m_i * 37
        draw.text((box_b_x + 18, my), "• " + m_name, fill=C_ESPRESSO, font=get_font(15, bold=True))
        draw.text((box_b_x + 235, my), m_desc, fill=C_WALNUT, font=get_font(14, bold=False))

    # Box C: Storage & Background Queues
    box_c_x = box_b_x + box_b_w + 25
    box_c_w = main_w - (box_a_w + box_b_w + 110)
    draw_rounded_rect(draw, (box_c_x, t2_y1 + 80, box_c_x + box_c_w, t2_y2 - 25), 10, C_PILL_BG, C_PILL_BRD, 1)
    draw.text((box_c_x + 18, t2_y1 + 95), "DATA & QUEUES", fill=C_SAGE, font=get_font(18, bold=True))
    storage_items = [
        ("MongoDB Atlas", "11 Mongoose document collections for products, sales, and alerts."),
        ("Redis 7 Cache", "Sub-250ms memory cache for instant dashboard stats."),
        ("BullMQ Workers", "Asynchronous worker jobs for scraper runs and AI tasks."),
        ("Node-Cron", "Scheduled hourly price parity checks and alert triggers.")
    ]
    for s_i, (s_name, s_desc) in enumerate(storage_items):
        sy = t2_y1 + 130 + s_i * 64
        draw.text((box_c_x + 18, sy), s_name, fill=C_ESPRESSO, font=get_font(16, bold=True))
        draw.text((box_c_x + 18, sy + 24), s_desc, fill=C_WALNUT, font=get_font(13, bold=False))

    # Connector 2 -> 3
    draw_arrow_down(draw, main_x + 450, t2_y2, t2_y2 + 80, C_DEEP_TERRA, "Internal HTTP / JSON (FastAPI Engine)")

    # ─────────────────────────────────────────────────────────
    # TIER 3: AI INTELLIGENCE MICROSERVICE (Python FastAPI)
    # ─────────────────────────────────────────────────────────
    t3_y1, t3_y2 = 1120, 1540
    draw_rounded_rect(draw, (main_x, t3_y1, main_x + main_w, t3_y2), 16, C_WHITE, C_DEEP_TERRA, 2)

    # Tier 3 Title Bar
    draw_rounded_rect(draw, (main_x + 20, t3_y1 + 18, main_x + 440, t3_y1 + 62), 10, (248, 238, 233), C_DEEP_TERRA, 1)
    draw.text((main_x + 35, t3_y1 + 25), "3  AI MICROSERVICE TIER", fill=C_DEEP_TERRA, font=get_font(20, bold=True))
    draw.text((main_x + 480, t3_y1 + 27), "Python 3.12  •  FastAPI  •  LangGraph  •  Facebook Prophet  •  ChromaDB  •  SciPy", fill=C_WALNUT, font=get_font(20, bold=True))

    # Inner Boxes for AI Tier
    ai_box1_w = 830
    draw_rounded_rect(draw, (main_x + 30, t3_y1 + 80, main_x + 30 + ai_box1_w, t3_y2 - 25), 10, C_PILL_BG, C_PILL_BRD, 1)
    draw.text((main_x + 48, t3_y1 + 95), "CORE AI / ML ALGORITHMS", fill=C_DEEP_TERRA, font=get_font(18, bold=True))
    ai_algos = [
        ("Bayesian Price Elasticity", "Estimates sensitivity curves e = (% dQ) / (% dP) with rival price differentials."),
        ("Binary Search Profit Maximizer", "Locates exact selling price P* maximizing gross profit subject to margin bounds."),
        ("Facebook Prophet Time-Series", "Additive daily order volume forecasting with 70–95% confidence intervals."),
        ("LangGraph Multi-Agent Swarm", "Sanitization -> Archetype -> Anti-Self-Brand Filter -> Rival Scraping.")
    ]
    for a_i, (a_name, a_desc) in enumerate(ai_algos):
        ay = t3_y1 + 130 + a_i * 64
        draw.text((main_x + 48, ay), a_name, fill=C_ESPRESSO, font=get_font(16, bold=True))
        draw.text((main_x + 48, ay + 24), a_desc, fill=C_WALNUT, font=get_font(13, bold=False))

    ai_box2_x = main_x + 30 + ai_box1_w + 30
    ai_box2_w = main_w - (ai_box1_w + 90)
    draw_rounded_rect(draw, (ai_box2_x, t3_y1 + 80, ai_box2_x + ai_box2_w, t3_y2 - 25), 10, C_PILL_BG, C_PILL_BRD, 1)
    draw.text((ai_box2_x + 20, t3_y1 + 95), "COGNITIVE MEMORY & RAG ARCHITECTURE", fill=C_DEEP_TERRA, font=get_font(18, bold=True))
    rag_items = [
        ("Working Memory (Context RAM)", "Session history, system personas, live SKU telemetry, cost chips."),
        ("Semantic Vector Memory (ChromaDB)", "Cosine similarity search over catalog specs and pricing playbooks."),
        ("Episodic Vector Memory (ChromaDB)", "Session-tagged past conversations and user feedback logs."),
        ("Resilient LLM Routing Pipeline", "Primary Google Gemini 2.5 Flash -> fallback OpenRouter Nemotron 70B.")
    ]
    for rg_i, (rg_name, rg_desc) in enumerate(rag_items):
        rgy = t3_y1 + 130 + rg_i * 64
        draw.text((ai_box2_x + 20, rgy), rg_name, fill=C_ESPRESSO, font=get_font(16, bold=True))
        draw.text((ai_box2_x + 20, rgy + 24), rg_desc, fill=C_WALNUT, font=get_font(13, bold=False))

    # ─────────────────────────────────────────────────────────
    # EXTERNAL SERVICES (Right Column)
    # ─────────────────────────────────────────────────────────
    draw_rounded_rect(draw, (ext_x, 180, ext_x + ext_w, 1540), 16, C_WHITE, C_BRASS, 2)
    
    # Header for External Services
    draw_rounded_rect(draw, (ext_x + 20, 198, ext_x + ext_w - 20, 246), 10, (250, 245, 232), C_BRASS, 1)
    draw.text((ext_x + 40, 208), "EXTERNAL SERVICES & CLOUD APIS", fill=C_BRASS, font=get_font(20, bold=True))

    ext_services = [
        ("Google Gemini API", "Primary LLM Provider", "Gemini 2.5 Flash for plain-English XAI narratives and chat copilot.", (66, 133, 244)),
        ("OpenRouter API", "Fallback LLM Provider", "High-reasoning NVIDIA Nemotron 70B for resilient agent failover.", (99, 102, 241)),
        ("Rainforest API", "Live Amazon Data", "Real-time pricing, competitor ASINs, stock availability, ratings.", (46, 125, 50)),
        ("BeautifulSoup Scraper", "Flipkart India Data", "Automated HTML parsing for multi-marketplace competitor benchmarks.", (255, 112, 67)),
        ("OpenWeatherMap API", "Weather Telemetry", "Ingests temperature and rain data to bias weather-sensitive categories.", (245, 124, 0)),
        ("NewsAPI Telemetry", "Market Sentiment", "Scans supply chain news and consumer headlines for demand adjustments.", (120, 80, 160)),
        ("SerpAPI / Google Trends", "Search Momentum", "Tracks relative keyword search volume for category demand scoring.", (33, 150, 243)),
        ("SendGrid Mailer", "Notification Service", "Automated email dispatcher for critical stockout and margin alerts.", (30, 136, 229))
    ]

    card_y_start = 270
    card_ext_h = 138
    for e_i, (svc_name, svc_type, svc_detail, svc_accent) in enumerate(ext_services):
        ey = card_y_start + e_i * (card_ext_h + 16)
        draw_rounded_rect(draw, (ext_x + 20, ey, ext_x + ext_w - 20, ey + card_ext_h), 10, C_PILL_BG, C_PILL_BRD, 1)
        
        # Color dot / pill
        draw.ellipse((ext_x + 38, ey + 20, ext_x + 52, ey + 34), fill=svc_accent)
        draw.text((ext_x + 65, ey + 15), svc_name, fill=C_ESPRESSO, font=get_font(18, bold=True))
        
        # Type badge
        draw_rounded_rect(draw, (ext_x + ext_w - 240, ey + 15, ext_x + ext_w - 35, ey + 42), 6, (244, 238, 230), C_BORDER, 1)
        draw.text((ext_x + ext_w - 230, ey + 19), svc_type, fill=C_TERRA, font=get_font(13, bold=True))
        
        draw.text((ext_x + 38, ey + 55), svc_detail, fill=C_WALNUT, font=get_font(15, bold=False))

    # Connectors between AI / Backend and External Services
    draw_arrow_right(draw, main_x + main_w, ext_x, 380, C_TERRA, "Telemetrics")
    draw_arrow_right(draw, main_x + main_w, ext_x, 840, C_SAGE, "Marketplace APIs")
    draw_arrow_right(draw, main_x + main_w, ext_x, 1330, C_DEEP_TERRA, "LLM & Scraper Requests")

    img.save(out_path, "PNG")
    print(f"Architecture diagram generated successfully: {out_path} ({os.path.getsize(out_path)} bytes)")
    return out_path

if __name__ == "__main__":
    generate_diagram()
