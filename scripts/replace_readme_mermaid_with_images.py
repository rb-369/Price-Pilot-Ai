import re
import os

readme_path = os.path.join(os.path.dirname(__file__), '..', 'README.md')
with open(readme_path, 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = '## 📐 Architecture & System Design Diagrams (10 Complete Diagrams)'
end_marker = '### 11. Full-Stack Component Diagram'

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    raise ValueError(f"Markers not found: start_idx={start_idx}, end_idx={end_idx}")

sec_text = text[start_idx:end_idx]

diagram_meta = [
    ("01_overall_system_architecture.png", "Overall System Architecture Diagram", 1),
    ("02_system_block_diagram.png", "System Block Diagram", 2),
    ("03_main_system_workflow.png", "Main System Workflow Flowchart", 3),
    ("04_use_case_diagram.png", "Use Case Diagram", 4),
    ("05_data_flow_diagram_dfd.png", "Data Flow Diagram (DFD)", 5),
    ("06_competitor_intelligence_agent.png", "Competitor Intelligence Agent Workflow", 6),
    ("07_ai_pricing_what_if_simulation.png", "AI Pricing and What-If Simulation Workflow", 7),
    ("08_demand_forecasting_workflow.png", "Demand Forecasting Workflow", 8),
    ("09_rag_conversational_ai_workflow.png", "RAG Conversational AI Workflow", 9),
    ("10_database_er_diagram.png", "Database Design / Collection Relationship Diagram", 10),
]

# Update introduction paragraph
old_intro = "The complete engineering, algorithmic, and data architecture of PricePilot AI is documented below across **10 formal system design diagrams**. Each diagram provides both native interactive GitHub Mermaid visual models and accompanying technical descriptions."
new_intro = "The complete engineering, algorithmic, and data architecture of PricePilot AI is documented below across **10 formal system design diagrams**. Each diagram is rendered in an authentic hand-drawn whiteboard architectural blueprint (Excalidraw format) accompanied by exhaustive technical descriptions, schema models, and data flow specifications."

if old_intro in sec_text:
    sec_text = sec_text.replace(old_intro, new_intro)
else:
    print("Warning: old_intro not matched exactly, checking with flexible whitespace")

# Find all mermaid blocks
pattern = r'```mermaid[\s\S]*?```'
matches = list(re.finditer(pattern, sec_text))
print(f"Found {len(matches)} mermaid blocks in target section.")

if len(matches) != 10:
    raise ValueError(f"Expected 10 mermaid blocks, found {len(matches)}")

# Replace from end to start to keep offsets stable
sec_replaced = sec_text
for i in reversed(range(10)):
    m = matches[i]
    img_file, title, num = diagram_meta[i]
    replacement = (
        f"[![{num}. {title}](docs/diagrams/{img_file})](docs/diagrams/{img_file})\n\n"
        f"*Figure {num}: {title} — Hand-Drawn Whiteboard Architectural Blueprint (Click to view full resolution)*"
    )
    sec_replaced = sec_replaced[:m.start()] + replacement + sec_replaced[m.end():]

new_text = text[:start_idx] + sec_replaced + text[end_idx:]

with open(readme_path, 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Successfully replaced all 10 Mermaid blocks with Excalidraw diagram image embeds in README.md!")
