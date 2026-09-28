import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineDocumentText,
    HiOutlineArrowLeft,
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineSearch,
    HiOutlineClipboardCheck,
    HiOutlineClipboard,
    HiOutlineLightningBolt,
    HiOutlineCubeTransparent,
    HiOutlineShieldCheck,
    HiOutlineCode,
    HiOutlineTerminal,
    HiOutlineCheck,
    HiOutlineThumbUp,
    HiOutlineThumbDown,
    HiOutlineExternalLink,
    HiOutlineServer,
    HiOutlineKey,
    HiOutlineChartBar
} from 'react-icons/hi';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';
import { useTheme } from '../context/ThemeContext';

const navigationSections = [
    {
        category: 'Getting Started',
        icon: HiOutlineDocumentText,
        items: [
            { id: 'overview', title: 'Platform Overview' },
            { id: 'quickstart', title: 'Quickstart Guide' },
            { id: 'architecture', title: 'System Architecture' }
        ]
    },
    {
        category: 'Core AI Engines',
        icon: HiOutlineLightningBolt,
        items: [
            { id: 'dynamic-pricing', title: 'Binary-Search Pricing Engine' },
            { id: 'demand-forecasting', title: 'Multi-Signal Demand Model' },
            { id: 'xai-gemini', title: 'Explainable AI (XAI) Engine' }
        ]
    },
    {
        category: 'API & Microservices',
        icon: HiOutlineServer,
        items: [
            { id: 'swagger-portal', title: 'OpenAPI 3.0 Swagger Portal' },
            { id: 'fastapi-gateway', title: 'FastAPI AI Microservice' },
            { id: 'express-backend', title: 'Express.js Core Backend' },
            { id: 'rainforest-scraper', title: 'Competitor Scraper API' }
        ]
    },
    {
        category: 'Security & Operations',
        icon: HiOutlineShieldCheck,
        items: [
            { id: 'encryption', title: 'Data Security & Privacy' },
            { id: 'rate-limiting', title: 'Rate Limiting & Health' }
        ]
    }
];

const codeExamples = {
    curl: `curl -X POST "https://price-pilot-ai.onrender.com/api/pricing/recommend" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "product_id": "prod_88492",
    "cost_price": 45.00,
    "current_price": 69.99,
    "competitor_prices": [64.99, 68.50, 72.00],
    "inventory_level": 140,
    "target_margin": 0.25
  }'`,
    javascript: `import fetch from 'node-fetch';

const response = await fetch('https://price-pilot-ai.onrender.com/api/pricing/recommend', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    product_id: 'prod_88492',
    cost_price: 45.00,
    current_price: 69.99,
    competitor_prices: [64.99, 68.50, 72.00],
    inventory_level: 140,
    target_margin: 0.25
  })
});

const data = await response.json();
console.log('Optimized Price:', data.recommended_price);
console.log('Gemini Explanation:', data.explanation);`,
    python: `import requests

url = "https://price-pilot-ai.onrender.com/api/pricing/recommend"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
payload = {
    "product_id": "prod_88492",
    "cost_price": 45.00,
    "current_price": 69.99,
    "competitor_prices": [64.99, 68.50, 72.00],
    "inventory_level": 140,
    "target_margin": 0.25
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Recommended Price:", data["recommended_price"])
print("Reasoning:", data["explanation"])`
};

export default function Docs() {
    const { theme, toggleTheme } = useTheme();
    const logoIcon = theme === 'dark' ? newDarkLogo : newLightLogo;
    const [activeSection, setActiveSection] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeLang, setActiveLang] = useState('javascript');
    const [copied, setCopied] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(null);

    // Scroll to section on click
    const scrollToSection = (id) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(codeExamples[activeLang]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Filter sections based on search query
    const filteredSections = navigationSections.map(sec => ({
        ...sec,
        items: sec.items.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(sec => sec.items.length > 0);

    return (
        <div className="min-h-screen bg-[#F0EEE6] dark:bg-[#211610] text-text transition-colors duration-300 flex flex-col relative overflow-x-hidden font-sans">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-[#F0EEE6]/90 dark:bg-[#211610]/90 backdrop-blur-xl border-b border-border transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-light border border-border text-text-muted hover:text-primary transition-colors text-xs font-semibold"
                        >
                            <HiOutlineArrowLeft className="w-4 h-4" /> Home
                        </Link>

                        <div className="h-6 w-px bg-border hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center">
                                <img src={logoIcon} alt="PricePilot AI Logo" className="w-full h-full object-contain drop-shadow-sm" />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-text">
                                PricePilot <span className="text-primary font-bold">Docs</span>
                            </span>
                        </div>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block w-72">
                            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documentation..."
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-border bg-surface-light text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full text-text-muted hover:text-text hover:bg-surface-lighter border border-border transition-colors cursor-pointer"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <HiOutlineSun className="w-5 h-5 text-brass" />
                            ) : (
                                <HiOutlineMoon className="w-5 h-5 text-primary" />
                            )}
                        </button>

                        <Link
                            to="/demo"
                            className="hidden sm:inline-flex btn-primary py-2 px-5 rounded-full text-xs font-semibold shadow-md"
                        >
                            See Demo →
                        </Link>
                    </div>
                </div>
            </header>

            {/* Documentation Hub Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">

                {/* Sidebar Navigation */}
                <aside className="sticky top-28 space-y-8 bg-surface border border-border p-6 rounded-3xl shadow-lg transition-colors">
                    <div className="md:hidden mb-4">
                        <div className="relative w-full">
                            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documentation..."
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-border bg-surface-light text-text placeholder:text-text-muted focus:outline-none"
                            />
                        </div>
                    </div>

                    {filteredSections.map((sec) => {
                        const IconComponent = sec.icon;
                        return (
                            <div key={sec.category} className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                    <IconComponent className="w-4 h-4" />
                                    <span>{sec.category}</span>
                                </div>
                                <ul className="space-y-1.5 pl-2 border-l border-border">
                                    {sec.items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => scrollToSection(item.id)}
                                                className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all font-medium cursor-pointer ${activeSection === item.id
                                                    ? 'bg-primary text-white font-semibold shadow-md'
                                                    : 'text-text-muted hover:bg-surface-lighter hover:text-text'
                                                    }`}
                                            >
                                                {item.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}

                    <div className="pt-6 border-t border-border">
                        <a
                            href="https://github.com/rb-369/Price-Pilot-Ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-primary transition-colors"
                        >
                            <HiOutlineExternalLink className="w-4 h-4" /> GitHub Repository
                        </a>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="space-y-16">

                    {/* Section 1: Overview */}
                    <section id="overview" className="scroll-mt-32 rounded-[2rem] border border-border bg-surface backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold text-xs mb-6">
                            <HiOutlineDocumentText className="w-4 h-4" /> Overview & Vision
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold text-text mb-6 leading-tight">
                            PricePilot AI <span className="bg-gradient-to-r from-primary via-copper to-brass bg-clip-text text-transparent">Documentation</span>
                        </h1>

                        <p className="text-text-muted text-lg leading-relaxed mb-8">
                            PricePilot AI is an enterprise-grade e-commerce pricing optimization and demand intelligence platform.
                            It bridges deterministic binary-search margin controls with generative AI insights from Google Gemini to deliver real-time, explainable price adjustments across multi-channel storefronts.
                        </p>

                        <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-border">
                            <div className="bg-surface-light p-5 rounded-2xl border border-border">
                                <p className="text-xs uppercase font-bold tracking-wider text-text-muted mb-1">Response Speed</p>
                                <p className="text-2xl font-extrabold text-text">&lt; 150ms</p>
                                <p className="text-xs text-text-muted mt-1">Real-time dynamic refresh</p>
                            </div>
                            <div className="bg-surface-light p-5 rounded-2xl border border-border">
                                <p className="text-xs uppercase font-bold tracking-wider text-text-muted mb-1">Microservices</p>
                                <p className="text-2xl font-extrabold text-primary">FastAPI + Node</p>
                                <p className="text-xs text-text-muted mt-1">Decoupled AI engine</p>
                            </div>
                            <div className="bg-surface-light p-5 rounded-2xl border border-border">
                                <p className="text-xs uppercase font-bold tracking-wider text-text-muted mb-1">AI Intelligence</p>
                                <p className="text-2xl font-extrabold text-text">Gemini 1.5</p>
                                <p className="text-xs text-text-muted mt-1">Explainable Reasoning (XAI)</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Quickstart Guide */}
                    <section id="quickstart" className="scroll-mt-32 rounded-[2rem] border border-border bg-surface backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold text-xs mb-6">
                            <HiOutlineTerminal className="w-4 h-4" /> Quickstart Guide
                        </div>

                        <h2 className="text-3xl font-extrabold text-text mb-6">Integration in 4 Simple Steps</h2>

                        <div className="space-y-8">
                            {[
                                { step: '01', title: 'Register Account & Obtain API Token', desc: 'Sign up on PricePilot AI, navigate to Developer Settings, and generate a bearer token for authentication.' },
                                { step: '02', title: 'Ingest Product Catalog', desc: 'Sync your catalog via CSV upload or standard REST API endpoints including base cost, inventory levels, and target margins.' },
                                { step: '03', title: 'Connect Competitor Signals', desc: 'Provide competitor Amazon ASINs or web domain targets for automated Rainforest API scraping.' },
                                { step: '04', title: 'Receive Real-time Price Recommendations', desc: 'Query the FastAPI recommendation engine to receive optimized prices alongside detailed AI reasoning explanations.' }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-primary text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0 shadow-md">
                                        {item.step}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-text">{item.title}</h3>
                                        <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 3: Architecture Diagram */}
                    <section id="architecture" className="scroll-mt-32 rounded-[2rem] border border-border bg-surface backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold text-xs mb-6">
                            <HiOutlineCubeTransparent className="w-4 h-4" /> Visual Architecture
                        </div>

                        <h2 className="text-3xl font-extrabold text-text mb-4">Multi-Tier Microservice Pipeline</h2>
                        <p className="text-text-muted leading-relaxed mb-8">
                            Data flows dynamically across decoupled microservices to calculate exact optimal prices while maintaining strict profit margins.
                        </p>

                        {/* Interactive Node Graph */}
                        <div className="bg-surface-light p-8 rounded-3xl border border-border text-text space-y-6">
                            <div className="grid md:grid-cols-4 gap-4 text-center">
                                <div className="p-4 rounded-2xl bg-surface border border-border">
                                    <span className="text-xs text-primary font-bold uppercase">Layer 1</span>
                                    <p className="font-bold text-text mt-1">E-Commerce Client</p>
                                    <p className="text-xs text-text-muted mt-1">React Dashboard & APIs</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-surface border border-border">
                                    <span className="text-xs text-sage font-bold uppercase">Layer 2</span>
                                    <p className="font-bold text-text mt-1">Express Gateway</p>
                                    <p className="text-xs text-text-muted mt-1">Auth, Redis & Mongo</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-surface border border-border">
                                    <span className="text-xs text-copper font-bold uppercase">Layer 3</span>
                                    <p className="font-bold text-text mt-1">FastAPI AI Engine</p>
                                    <p className="text-xs text-text-muted mt-1">Binary Search Algo</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-surface border border-border">
                                    <span className="text-xs text-brass font-bold uppercase">Layer 4</span>
                                    <p className="font-bold text-text mt-1">Google Gemini XAI</p>
                                    <p className="text-xs text-text-muted mt-1">Natural Explanations</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Dynamic Pricing Engine */}
                    <section id="dynamic-pricing" className="scroll-mt-32 rounded-[2rem] border border-border bg-surface backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold text-xs mb-6">
                            <HiOutlineLightningBolt className="w-4 h-4" /> Core Engine
                        </div>

                        <h2 className="text-3xl font-extrabold text-text mb-4">Binary-Search Margin Optimizer</h2>
                        <p className="text-text-muted leading-relaxed mb-6">
                            Unlike naive linear repricers that trigger margin erosion, PricePilot uses a binary search algorithm combined with elasticity pricing curves to pinpoint maximum profitability.
                        </p>

                        <div className="bg-surface-light p-6 rounded-2xl border border-border space-y-4">
                            <h3 className="font-semibold text-text text-lg">Key Algorithm Parameters</h3>
                            <ul className="grid sm:grid-cols-2 gap-4 text-sm text-text">
                                <li className="flex items-center gap-2"><HiOutlineCheck className="text-sage" /> Cost Floor Protection</li>
                                <li className="flex items-center gap-2"><HiOutlineCheck className="text-sage" /> Competitor Price Ceiling</li>
                                <li className="flex items-center gap-2"><HiOutlineCheck className="text-sage" /> Inventory Velocity Dampening</li>
                                <li className="flex items-center gap-2"><HiOutlineCheck className="text-sage" /> Margin Guardrails (&gt; 20%)</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section: OpenAPI 3.0 Swagger Portal */}
                    <section id="swagger-portal" className="scroll-mt-32 rounded-[2rem] border border-copper/30 bg-surface backdrop-blur-xl p-8 md:p-12 shadow-2xl transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-copper/10 border border-copper/30 text-copper font-semibold text-xs">
                                <HiOutlineServer className="w-4 h-4" /> Live Interactive Swagger UI
                            </div>
                            <span className="px-3 py-1 rounded-full bg-sage/10 text-sage border border-sage/30 text-xs font-semibold">
                                OpenAPI 3.0.3 Specification
                            </span>
                        </div>

                        <h2 className="text-3xl font-extrabold text-text mb-4">Interactive REST API Portal & Swagger UI</h2>
                        <p className="text-text-muted leading-relaxed mb-8">
                            PricePilot AI provides 18+ fully documented, authenticated REST endpoints for enterprise multi-channel integration. Explore schemas, test live requests, and inspect JWT authorization workflows directly in our interactive Swagger UI.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="p-5 rounded-2xl bg-surface-light border border-border">
                                <span className="text-xs uppercase font-bold text-copper">18+ Endpoints</span>
                                <h4 className="text-base font-bold text-text mt-1">Full CRUD & AI Inference</h4>
                                <p className="text-xs text-text-muted mt-2">Dynamic pricing, Prophet forecasting, competitor scraping, and copilot endpoints.</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-surface-light border border-border">
                                <span className="text-xs uppercase font-bold text-primary">JWT Security</span>
                                <h4 className="text-base font-bold text-text mt-1">Bearer Authentication</h4>
                                <p className="text-xs text-text-muted mt-2">Tested with per-tenant data scoping and role-based multi-channel access control.</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-surface-light border border-border">
                                <span className="text-xs uppercase font-bold text-sage">Live Execution</span>
                                <h4 className="text-base font-bold text-text mt-1">Interactive Sandbox</h4>
                                <p className="text-xs text-text-muted mt-2">Click "Try it out" to send real payloads and inspect live model responses.</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <a
                                href="https://price-pilot-ai.onrender.com/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-copper text-white font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-95 transition-all transform hover:-translate-y-0.5"
                            >
                                <HiOutlineExternalLink className="w-5 h-5" /> Launch Live Swagger UI Portal →
                            </a>
                            <a
                                href="https://price-pilot-ai.onrender.com/api/docs/swagger.json"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-light border border-border text-text hover:bg-surface-lighter text-sm font-semibold transition"
                            >
                                <HiOutlineCode className="w-4 h-4" /> Raw OpenAPI JSON Spec
                            </a>
                        </div>
                    </section>

                    {/* Section 5: API Reference & Interactive Code Snippets */}
                    <section id="fastapi-gateway" className="scroll-mt-32 rounded-[2rem] border border-border bg-surface backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold text-xs mb-6">
                            <HiOutlineCode className="w-4 h-4" /> API Reference
                        </div>

                        <h2 className="text-3xl font-extrabold text-text mb-4">Pricing Recommendation Endpoint</h2>
                        <p className="text-text-muted leading-relaxed mb-6">
                            Send real-time competitor prices and stock metrics to receive optimized pricing and Gemini explainability rationale.
                        </p>

                        {/* Endpoint Badge */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-light border border-border text-text font-mono text-sm mb-6">
                            <span className="px-2 py-0.5 rounded bg-sage text-white font-bold text-xs">POST</span>
                            <span>/api/pricing/recommend</span>
                        </div>

                        {/* Interactive Code Switcher */}
                        <div className="rounded-2xl border border-border bg-surface-light overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
                                <div className="flex gap-2">
                                    {['javascript', 'python', 'curl'].map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setActiveLang(lang)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${activeLang === lang
                                                ? 'bg-primary text-white shadow'
                                                : 'text-text-muted hover:text-text hover:bg-surface-lighter'
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleCopyCode}
                                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
                                >
                                    {copied ? (
                                        <>
                                            <HiOutlineClipboardCheck className="w-4 h-4 text-sage" />
                                            <span className="text-sage font-medium">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <HiOutlineClipboard className="w-4 h-4" />
                                            <span>Copy Snippet</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <pre className="p-6 overflow-x-auto text-xs sm:text-sm font-mono text-text leading-relaxed">
                                <code>{codeExamples[activeLang]}</code>
                            </pre>
                        </div>
                    </section>

                    {/* Section 6: Security & Feedback */}
                    <section id="encryption" className="scroll-mt-32 rounded-[2rem] border border-border bg-surface backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-semibold text-xs mb-6">
                            <HiOutlineShieldCheck className="w-4 h-4" /> Security & Privacy
                        </div>

                        <h2 className="text-3xl font-extrabold text-text mb-4">Enterprise Data Protection</h2>
                        <p className="text-text-muted leading-relaxed mb-8">
                            All competitor tracking queries, catalog cost prices, and pricing model configurations are encrypted at rest using AES-256 and in transit via TLS 1.3. Your proprietary data is never shared externally.
                        </p>

                        {/* Was this helpful widget */}
                        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm font-semibold text-text">Was this documentation page helpful?</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setFeedbackSent('yes')}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition cursor-pointer ${feedbackSent === 'yes' ? 'bg-sage text-white border-sage' : 'bg-surface-light border-border text-text hover:bg-surface-lighter'}`}
                                >
                                    <HiOutlineThumbUp className="w-4 h-4" /> Yes
                                </button>
                                <button
                                    onClick={() => setFeedbackSent('no')}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition cursor-pointer ${feedbackSent === 'no' ? 'bg-danger text-white border-danger' : 'bg-surface-light border-border text-text hover:bg-surface-lighter'}`}
                                >
                                    <HiOutlineThumbDown className="w-4 h-4" /> No
                                </button>
                            </div>
                        </div>
                    </section>

                </main>
            </div>
        </div>
    );
}
