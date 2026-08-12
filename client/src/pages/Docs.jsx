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
        <div className="min-h-screen bg-surface dark:bg-[#0B0F17] text-text dark:text-white transition-colors duration-300 flex flex-col relative overflow-x-hidden font-sans">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B0F17]/90 backdrop-blur-xl border-b border-purple-100 dark:border-white/10 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-700 dark:text-white/80 hover:text-indigo-600 dark:hover:text-primary transition-colors text-xs font-semibold"
                        >
                            <HiOutlineArrowLeft className="w-4 h-4" /> Home
                        </Link>

                        <div className="h-6 w-px bg-purple-200 dark:bg-white/10 hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 relative flex items-center justify-center">
                                <img src={logoIcon} alt="PricePilot AI Logo" className="w-full h-full object-contain drop-shadow-sm" />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                                PricePilot <span className="text-indigo-600 dark:text-primary">Docs</span>
                            </span>
                        </div>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block w-72">
                            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documentation..."
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-purple-200 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full text-slate-600 dark:text-white/80 hover:bg-purple-100/50 dark:hover:bg-white/10 border border-purple-200 dark:border-white/10 transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <HiOutlineSun className="w-5 h-5 text-amber-400" />
                            ) : (
                                <HiOutlineMoon className="w-5 h-5 text-indigo-600" />
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
                <aside className="sticky top-28 space-y-8 bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-purple-100 dark:border-white/10 p-6 rounded-3xl shadow-lg transition-colors">
                    <div className="md:hidden mb-4">
                        <div className="relative w-full">
                            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documentation..."
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-purple-200 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none"
                            />
                        </div>
                    </div>

                    {filteredSections.map((sec) => {
                        const IconComponent = sec.icon;
                        return (
                            <div key={sec.category} className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-primary">
                                    <IconComponent className="w-4 h-4" />
                                    <span>{sec.category}</span>
                                </div>
                                <ul className="space-y-1.5 pl-2 border-l border-purple-100 dark:border-white/10">
                                    {sec.items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => scrollToSection(item.id)}
                                                className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all font-medium ${activeSection === item.id
                                                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                                                    : 'text-slate-600 dark:text-white/70 hover:bg-purple-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
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

                    <div className="pt-6 border-t border-purple-100 dark:border-white/10">
                        <a
                            href="https://github.com/rb-369/Price-Pilot-Ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-white/60 hover:text-indigo-600 dark:hover:text-primary transition-colors"
                        >
                            <HiOutlineExternalLink className="w-4 h-4" /> GitHub Repository
                        </a>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="space-y-16">

                    {/* Section 1: Overview */}
                    <section id="overview" className="scroll-mt-32 rounded-[2rem] border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-6">
                            <HiOutlineDocumentText className="w-4 h-4" /> Overview & Vision
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                            PricePilot AI <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-400 bg-clip-text text-transparent">Documentation</span>
                        </h1>

                        <p className="text-slate-600 dark:text-white/70 text-lg leading-relaxed mb-8">
                            PricePilot AI is an enterprise-grade e-commerce pricing optimization and demand intelligence platform.
                            It bridges deterministic binary-search margin controls with generative AI insights from Google Gemini to deliver real-time, explainable price adjustments across multi-channel storefronts.
                        </p>

                        <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-purple-100 dark:border-white/10">
                            <div className="bg-purple-50/50 dark:bg-white/5 p-5 rounded-2xl border border-purple-100 dark:border-white/10">
                                <p className="text-xs uppercase font-bold tracking-wider text-slate-400 dark:text-white/40 mb-1">Response Speed</p>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">&lt; 150ms</p>
                                <p className="text-xs text-slate-500 dark:text-white/60 mt-1">Real-time dynamic refresh</p>
                            </div>
                            <div className="bg-purple-50/50 dark:bg-white/5 p-5 rounded-2xl border border-purple-100 dark:border-white/10">
                                <p className="text-xs uppercase font-bold tracking-wider text-slate-400 dark:text-white/40 mb-1">Microservices</p>
                                <p className="text-2xl font-extrabold text-indigo-600 dark:text-primary">FastAPI + Node</p>
                                <p className="text-xs text-slate-500 dark:text-white/60 mt-1">Decoupled AI engine</p>
                            </div>
                            <div className="bg-purple-50/50 dark:bg-white/5 p-5 rounded-2xl border border-purple-100 dark:border-white/10">
                                <p className="text-xs uppercase font-bold tracking-wider text-slate-400 dark:text-white/40 mb-1">AI Intelligence</p>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">Gemini 1.5</p>
                                <p className="text-xs text-slate-500 dark:text-white/60 mt-1">Explainable Reasoning (XAI)</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Quickstart Guide */}
                    <section id="quickstart" className="scroll-mt-32 rounded-[2rem] border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-6">
                            <HiOutlineTerminal className="w-4 h-4" /> Quickstart Guide
                        </div>

                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6">Integration in 4 Simple Steps</h2>

                        <div className="space-y-8">
                            {[
                                { step: '01', title: 'Register Account & Obtain API Token', desc: 'Sign up on PricePilot AI, navigate to Developer Settings, and generate a bearer token for authentication.' },
                                { step: '02', title: 'Ingest Product Catalog', desc: 'Sync your catalog via CSV upload or standard REST API endpoints including base cost, inventory levels, and target margins.' },
                                { step: '03', title: 'Connect Competitor Signals', desc: 'Provide competitor Amazon ASINs or web domain targets for automated Rainforest API scraping.' },
                                { step: '04', title: 'Receive Real-time Price Recommendations', desc: 'Query the FastAPI recommendation engine to receive optimized prices alongside detailed AI reasoning explanations.' }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0 shadow-md">
                                        {item.step}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
                                        <p className="text-slate-600 dark:text-white/70 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 3: Architecture Diagram */}
                    <section id="architecture" className="scroll-mt-32 rounded-[2rem] border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-6">
                            <HiOutlineCubeTransparent className="w-4 h-4" /> Visual Architecture
                        </div>

                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Multi-Tier Microservice Pipeline</h2>
                        <p className="text-slate-600 dark:text-white/70 leading-relaxed mb-8">
                            Data flows dynamically across decoupled microservices to calculate exact optimal prices while maintaining strict profit margins.
                        </p>

                        {/* Interactive Node Graph */}
                        <div className="bg-slate-900 dark:bg-[#050811] p-8 rounded-3xl border border-purple-100 dark:border-white/10 text-white space-y-6">
                            <div className="grid md:grid-cols-4 gap-4 text-center">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-xs text-indigo-400 font-bold uppercase">Layer 1</span>
                                    <p className="font-bold text-white mt-1">E-Commerce Client</p>
                                    <p className="text-xs text-white/50 mt-1">React Dashboard & APIs</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-xs text-emerald-400 font-bold uppercase">Layer 2</span>
                                    <p className="font-bold text-white mt-1">Express Gateway</p>
                                    <p className="text-xs text-white/50 mt-1">Auth, Redis & Mongo</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-xs text-cyan-400 font-bold uppercase">Layer 3</span>
                                    <p className="font-bold text-white mt-1">FastAPI AI Engine</p>
                                    <p className="text-xs text-white/50 mt-1">Binary Search Algo</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <span className="text-xs text-purple-400 font-bold uppercase">Layer 4</span>
                                    <p className="font-bold text-white mt-1">Google Gemini XAI</p>
                                    <p className="text-xs text-white/50 mt-1">Natural Explanations</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Dynamic Pricing Engine */}
                    <section id="dynamic-pricing" className="scroll-mt-32 rounded-[2rem] border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-6">
                            <HiOutlineLightningBolt className="w-4 h-4" /> Core Engine
                        </div>

                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Binary-Search Margin Optimizer</h2>
                        <p className="text-slate-600 dark:text-white/70 leading-relaxed mb-6">
                            Unlike naive linear repricers that trigger margin erosion, PricePilot uses a binary search algorithm combined with elasticity pricing curves to pinpoint maximum profitability.
                        </p>

                        <div className="bg-purple-50/50 dark:bg-white/5 p-6 rounded-2xl border border-purple-100 dark:border-white/10 space-y-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Key Algorithm Parameters</h3>
                            <ul className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-white/80">
                                <li className="flex items-center gap-2"><HiOutlineCheck className="text-emerald-500" /> Cost Floor Protection</li>
                                <li className="flex items-center gap-2"><HiOutlineCheck className="text-emerald-500" /> Competitor Price Ceiling</li>
                                <li className="flex items-center gap-2"><HiOutlineCheck className="text-emerald-500" /> Inventory Velocity Dampening</li>
                                <li className="flex items-center gap-2"><HiOutlineCheck className="text-emerald-500" /> Margin Guardrails (&gt; 20%)</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 5: API Reference & Interactive Code Snippets */}
                    <section id="fastapi-gateway" className="scroll-mt-32 rounded-[2rem] border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-6">
                            <HiOutlineCode className="w-4 h-4" /> API Reference
                        </div>

                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Pricing Recommendation Endpoint</h2>
                        <p className="text-slate-600 dark:text-white/70 leading-relaxed mb-6">
                            Send real-time competitor prices and stock metrics to receive optimized pricing and Gemini explainability rationale.
                        </p>

                        {/* Endpoint Badge */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 dark:bg-black border border-white/10 text-white font-mono text-sm mb-6">
                            <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-xs">POST</span>
                            <span>/api/pricing/recommend</span>
                        </div>

                        {/* Interactive Code Switcher */}
                        <div className="rounded-2xl border border-purple-100 dark:border-white/10 bg-slate-900 dark:bg-[#050811] overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-white/5">
                                <div className="flex gap-2">
                                    {['javascript', 'python', 'curl'].map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setActiveLang(lang)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${activeLang === lang
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleCopyCode}
                                    className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <HiOutlineClipboardCheck className="w-4 h-4 text-emerald-400" />
                                            <span className="text-emerald-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <HiOutlineClipboard className="w-4 h-4" />
                                            <span>Copy Snippet</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <pre className="p-6 overflow-x-auto text-xs sm:text-sm font-mono text-indigo-200 leading-relaxed">
                                <code>{codeExamples[activeLang]}</code>
                            </pre>
                        </div>
                    </section>

                    {/* Section 6: Security & Feedback */}
                    <section id="encryption" className="scroll-mt-32 rounded-[2rem] border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-8 md:p-12 shadow-xl transition-colors">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-6">
                            <HiOutlineShieldCheck className="w-4 h-4" /> Security & Privacy
                        </div>

                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Enterprise Data Protection</h2>
                        <p className="text-slate-600 dark:text-white/70 leading-relaxed mb-8">
                            All competitor tracking queries, catalog cost prices, and pricing model configurations are encrypted at rest using AES-256 and in transit via TLS 1.3. Your proprietary data is never shared externally.
                        </p>

                        {/* Was this helpful widget */}
                        <div className="pt-8 border-t border-purple-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Was this documentation page helpful?</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setFeedbackSent('yes')}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 dark:border-white/10 text-xs font-semibold transition ${feedbackSent === 'yes' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-purple-50/50 dark:bg-white/5 text-slate-700 dark:text-white/80 hover:bg-purple-100'}`}
                                >
                                    <HiOutlineThumbUp className="w-4 h-4" /> Yes
                                </button>
                                <button
                                    onClick={() => setFeedbackSent('no')}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 dark:border-white/10 text-xs font-semibold transition ${feedbackSent === 'no' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-purple-50/50 dark:bg-white/5 text-slate-700 dark:text-white/80 hover:bg-purple-100'}`}
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
