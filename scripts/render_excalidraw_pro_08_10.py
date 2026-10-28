import os
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080

FONT_BOLD = r'C:\Windows\Fonts\segoeprb.ttf'
FONT_REG = r'C:\Windows\Fonts\segoepr.ttf'

font_title = ImageFont.truetype(FONT_BOLD, 36)
font_sec = ImageFont.truetype(FONT_BOLD, 20)
font_body_bold = ImageFont.truetype(FONT_BOLD, 15)
font_body = ImageFont.truetype(FONT_REG, 15)
font_small = ImageFont.truetype(FONT_REG, 13)
font_notes = ImageFont.truetype(FONT_REG, 12)

def draw_hand_rect(draw, x1, y1, x2, y2, fill=None, outline=(35, 35, 40), width=2, radius=10):
    if fill:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill)
    if outline:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, outline=outline, width=width)

def draw_hand_arrow(draw, x1, y1, x2, y2, color=(50, 50, 60), width=2, label=""):
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)
    dx = x2 - x1
    dy = y2 - y1
    angle = math.atan2(dy, dx)
    arrow_len = 12
    arrow_angle = math.pi / 6
    x3 = x2 - arrow_len * math.cos(angle - arrow_angle)
    y3 = y2 - arrow_len * math.sin(angle - arrow_angle)
    x4 = x2 - arrow_len * math.cos(angle + arrow_angle)
    y4 = y2 - arrow_len * math.sin(angle + arrow_angle)
    draw.line([(x2, y2), (x3, y3)], fill=color, width=width)
    draw.line([(x2, y2), (x4, y4)], fill=color, width=width)
    if label:
        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2
        bbox = font_small.getbbox(label)
        lw = bbox[2] - bbox[0]
        lh = bbox[3] - bbox[1]
        draw.rounded_rectangle([mx - lw/2 - 5, my - lh/2 - 3, mx + lw/2 + 5, my + lh/2 + 3], radius=4, fill=(255, 255, 255, 245), outline=(180, 180, 190), width=1)
        draw.text((mx - lw/2, my - lh/2 - 2), label, fill=color, font=font_small)

def draw_title(draw, text, highlight_color=(179, 229, 252, 220)):
    bbox = font_title.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (W - tw) / 2
    ty = 35
    hx1 = tx - 15
    hx2 = tx + tw + 15
    hy1 = ty + th + 8
    hy2 = hy1 + 12
    draw.rounded_rectangle([hx1, hy1, hx2, hy2], radius=6, fill=highlight_color)
    draw.text((tx, ty), text, fill=(25, 25, 30), font=font_title)

def render_diagram_10():
    img = Image.new('RGB', (W, H), '#FFFFFF')
    draw = ImageDraw.Draw(img, 'RGBA')
    
    draw_title(draw, "PricePilot AI — Database Design & Collection Relationships", highlight_color=(179, 229, 252, 220))
    
    def draw_card(x, y, w, h, name, fields, header_bg, header_border, text_color):
        draw_hand_rect(draw, x, y, x + w, y + h, fill=(255, 255, 255), outline=header_border, width=2, radius=10)
        draw.rounded_rectangle([x, y, x + w, y + 36], radius=10, fill=header_bg)
        draw.rectangle([x, y + 20, x + w, y + 36], fill=header_bg)
        draw.line([(x, y + 36), (x + w, y + 36)], fill=header_border, width=2)
        draw.text((x + 12, y + 8), name, fill=text_color, font=font_body_bold)
        fy = y + 44
        for f in fields:
            draw.text((x + 12, fy), f, fill=(45, 45, 50), font=font_small)
            fy += 19

    # 6 Columns with 255px width and 55px gaps
    # Col 1: ALERT (x: 45)
    # Col 2: USER (x: 355)
    # Col 3: PRODUCT (x: 665)
    # Col 4: COMPETITOR_PRICE (x: 975)
    # Col 5: DEMAND_SIGNAL (x: 1285)
    # Col 6: DAILY_SALES_METRIC (x: 1595)

    alert_fields = [
        "ObjectId _id [PK]",
        "ObjectId productId [FK]",
        "ObjectId userId [FK]",
        "string type (stockout/price)",
        "string severity (high/critical)",
        "string message",
        "boolean read",
        "date timestamp"
    ]
    draw_card(45, 130, 255, 225, "ALERT", alert_fields, (255, 235, 238), (229, 57, 53), (183, 28, 28))

    user_fields = [
        "ObjectId _id [PK]",
        "string name",
        "string email [UK]",
        "string password (bcrypt)",
        "string role (admin/user)",
        "string storeName",
        "object preferences",
        "date createdAt"
    ]
    draw_card(355, 130, 255, 225, "USER", user_fields, (237, 231, 246), (103, 58, 183), (69, 39, 160))

    prod_fields = [
        "ObjectId _id [PK]",
        "ObjectId userId [FK]",
        "string name",
        "string sku [UK]",
        "string category",
        "number baseCost (COGS)",
        "number currentPrice",
        "number minMargin (0.10)",
        "number stockLevel",
        "number safetyBuffer",
        "object productLinks",
        "boolean syncEnabled"
    ]
    draw_card(665, 130, 255, 305, "PRODUCT", prod_fields, (232, 245, 233), (56, 142, 60), (27, 94, 32))

    comp_fields = [
        "ObjectId _id [PK]",
        "ObjectId productId [FK]",
        "string competitorName",
        "number competitorPrice",
        "string competitorUrl",
        "boolean inStock",
        "date timestamp"
    ]
    draw_card(975, 130, 255, 205, "COMPETITOR_PRICE", comp_fields, (227, 242, 253), (30, 136, 229), (13, 71, 161))

    demand_fields = [
        "ObjectId _id [PK]",
        "ObjectId productId [FK]",
        "number searchTrendScore",
        "number weatherFactor",
        "number eventFactor",
        "number sentimentScore",
        "number compositeScore",
        "date timestamp"
    ]
    draw_card(1285, 130, 255, 225, "DEMAND_SIGNAL", demand_fields, (224, 247, 250), (0, 172, 193), (0, 96, 100))

    sales_fields = [
        "ObjectId _id [PK]",
        "ObjectId productId [FK]",
        "date date",
        "number unitsSold",
        "number revenue",
        "number avgSellingPrice"
    ]
    draw_card(1595, 130, 280, 190, "DAILY_SALES_METRIC", sales_fields, (245, 245, 245), (117, 117, 117), (33, 33, 33))

    # ROW 2 (y: 470 to 760)
    chat_fields = [
        "ObjectId _id [PK]",
        "ObjectId userId [FK]",
        "array messages [q, a, role]",
        "ObjectId activeProductContext",
        "date timestamp"
    ]
    draw_card(45, 470, 255, 170, "CHAT_SESSION", chat_fields, (237, 231, 246), (126, 87, 194), (49, 27, 146))

    feed_fields = [
        "ObjectId _id [PK]",
        "ObjectId userId [FK]",
        "string type (bug/feature)",
        "number rating (1-5)",
        "string comment",
        "object systemTelemetry"
    ]
    draw_card(355, 470, 255, 190, "PLATFORM_FEEDBACK", feed_fields, (255, 248, 225), (255, 179, 0), (255, 111, 0))

    recs_fields = [
        "ObjectId _id [PK]",
        "ObjectId productId [FK]",
        "ObjectId userId [FK]",
        "number recommendedPrice",
        "number currentPrice",
        "number confidenceScore",
        "string status (pending/accepted)",
        "number elasticityUsed",
        "date appliedAt"
    ]
    draw_card(665, 470, 255, 245, "PRICING_RECOMMENDATION", recs_fields, (255, 243, 224), (245, 124, 0), (230, 81, 0))

    ab_fields = [
        "ObjectId _id [PK]",
        "ObjectId productId [FK]",
        "ObjectId recommendationId [1:1]",
        "object variantA (control)",
        "object variantB (ai_price)",
        "string status (active/done)",
        "string winner (A/B/tie)",
        "number confidenceLevel"
    ]
    draw_card(975, 470, 255, 225, "AB_TEST", ab_fields, (252, 228, 236), (216, 27, 96), (136, 14, 79))

    fore_fields = [
        "ObjectId _id [PK]",
        "ObjectId productId [FK]",
        "ObjectId userId [FK]",
        "number predictedDemand",
        "number recommendedStock",
        "number currentStock",
        "number forecastRange (30d)",
        "number confidenceScore"
    ]
    draw_card(1285, 470, 255, 225, "INVENTORY_FORECAST", fore_fields, (254, 243, 199), (217, 119, 6), (146, 64, 14))

    map_fields = [
        "ObjectId _id [PK]",
        "ObjectId productId [FK]",
        "string channel (shopify/amazon)",
        "string channelProductId",
        "string channelSku",
        "boolean isSynced",
        "date lastSyncedAt"
    ]
    draw_card(1595, 470, 280, 205, "PRODUCT_MAPPING", map_fields, (224, 242, 241), (0, 150, 136), (0, 77, 64))

    # Clean Arrows (zero crossings):
    # USER -> PRODUCT (1:N, direct clean horizontal)
    draw_hand_arrow(draw, 610, 200, 665, 200, color=(103, 58, 183), width=2, label="1:N Owns")
    # USER -> ALERT (1:N, direct clean left)
    draw_hand_arrow(draw, 355, 180, 300, 180, color=(229, 57, 53), width=2, label="1:N")
    # USER -> CHAT_SESSION (1:N, clean diagonal)
    draw_hand_arrow(draw, 355, 330, 280, 470, color=(126, 87, 194), width=2, label="1:N")
    # USER -> PLATFORM_FEEDBACK (1:N, direct vertical down)
    draw_hand_arrow(draw, 482, 355, 482, 470, color=(255, 179, 0), width=2, label="1:N")

    # PRODUCT -> COMPETITOR_PRICE (1:N, direct right)
    draw_hand_arrow(draw, 920, 200, 975, 200, color=(56, 142, 60), width=2, label="1:N")
    # COMPETITOR_PRICE -> DEMAND_SIGNAL (1:N, direct right)
    draw_hand_arrow(draw, 1230, 200, 1285, 200, color=(0, 172, 193), width=2, label="1:N")
    # DEMAND_SIGNAL -> DAILY_SALES_METRIC (1:N, direct right)
    draw_hand_arrow(draw, 1540, 200, 1595, 200, color=(117, 117, 117), width=2, label="1:N")

    # PRODUCT -> PRICING_RECOMMENDATION (1:N, direct vertical down)
    draw_hand_arrow(draw, 792, 435, 792, 470, color=(56, 142, 60), width=2, label="1:N Recs")
    # PRICING_REC -> AB_TEST (1:1 validation, direct right)
    draw_hand_arrow(draw, 920, 560, 975, 560, color=(216, 27, 96), width=2, label="1:1 Test")
    # AB_TEST -> INVENTORY_FORECAST (1:N, direct right)
    draw_hand_arrow(draw, 1230, 560, 1285, 560, color=(217, 119, 6), width=2, label="1:N")
    # INVENTORY_FORECAST -> PRODUCT_MAPPING (1:N, direct right)
    draw_hand_arrow(draw, 1540, 560, 1595, 560, color=(0, 150, 136), width=2, label="1:N Sync")

    # Bottom Left: Legend (x: 45 to 580, y: 810 to 1030)
    draw_hand_rect(draw, 45, 810, 580, 1030, fill=(255, 255, 255), outline=(130, 130, 140), width=2)
    draw.text((65, 825), "Schema Legend", fill=(40, 40, 45), font=font_sec)
    legend_items = [
        ((237, 231, 246), (103, 58, 183), "Identity & Account Store (USER)", 65, 865),
        ((232, 245, 233), (56, 142, 60), "Central Master Catalog (PRODUCT)", 65, 905),
        ((227, 242, 253), (30, 136, 229), "Scraped Competitor Price History", 65, 945),
        ((255, 243, 224), (245, 124, 0), "Optimization & Output Models", 65, 985),
        ((252, 228, 236), (216, 27, 96), "1:1 & 1:N Schema Relationships", 335, 865),
        ((255, 235, 238), (229, 57, 53), "Autonomous Alert System", 335, 905),
    ]
    for bg, brd, lbl, lx, ly in legend_items:
        draw_hand_rect(draw, lx, ly, lx + 20, ly + 20, fill=bg, outline=brd, width=2, radius=4)
        draw.text((lx + 30, ly + 1), lbl, fill=(50, 50, 55), font=font_small)

    # Bottom Right: Notes (x: 620 to 1875, y: 810 to 1030)
    draw_hand_rect(draw, 620, 810, 1875, 1030, fill=(255, 255, 255), outline=(130, 130, 140), width=2)
    draw.text((640, 825), "MongoDB Atlas Architecture & Index Topologies", fill=(40, 40, 45), font=font_sec)
    notes_list = [
        "• Primary Keys: Native 12-byte BSON ObjectId indexed automatically as `_id` across all 12 core collections.",
        "• Compound Time-Series Index: `{ productId: 1, timestamp: -1 }` on `COMPETITOR_PRICE` & `DEMAND_SIGNAL` for fast range queries.",
        "• Unique Constraints: Enforced via unique sparse indices on `USER.email` and `PRODUCT.sku`; referential integrity in Mongoose.",
        "• TTL Expiration: Ephemeral competitor scrape cache auto-expires after 7 days; aggregated sales metrics archived permanently."
    ]
    ny = 865
    for nl in notes_list:
        draw.text((640, ny), nl, fill=(55, 55, 60), font=font_small)
        ny += 35

    return img

if __name__ == '__main__':
    print("Re-rendering Diagram 10 with clean non-intersecting layout...")
    img10 = render_diagram_10()
    img10.save('docs/diagrams/10_database_er_diagram.png', 'PNG')
    img10.save('client/public/diagrams/10_database_er_diagram.png', 'PNG')
    print("Done! Diagram 10 rendered successfully.")
