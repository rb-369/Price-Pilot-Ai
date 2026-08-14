import { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { 
    HiOutlineLightningBolt, 
    HiOutlineCubeTransparent, 
    HiOutlineShieldCheck, 
    HiOutlineMail, 
    HiOutlineArrowUp,
    HiOutlineSparkles,
    HiOutlineSearch,
    HiOutlineCheckCircle,
    HiOutlineArrowRight
} from 'react-icons/hi';
import { SiShopify, SiStripe, SiWoocommerce, SiAmazon } from 'react-icons/si';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';
import ThemeToggle from '../components/ThemeToggle';
import HeroDashboard from '../components/HeroDashboard';

const faqCategories = ['All Questions', 'Pricing & AI', 'Security & Privacy', 'Integrations'];

const faqData = [
    {
        question: 'How does PricePilot AI protect my proprietary pricing data?',
        answer: 'We secure your pricing, competitor tracking, and forecast data using encryption and strict access controls. Your data is used only to improve your pricing strategy and is never shared externally without permission.',
        category: 'Security & Privacy'
    },
    {
        question: 'Is there a full privacy policy available?',
        answer: 'Yes, our full privacy policy is available on the Privacy Policy page and explains exactly how data is collected, stored, and used.',
        category: 'Security & Privacy'
    },
    {
        question: 'How do I get started with PricePilot AI?',
        answer: 'Start by signing up for an account, connecting your product catalog, and reviewing the onboarding guide. Our demo and docs help you launch in minutes.',
        category: 'Integrations'
    },
    {
        question: 'Which e-commerce platforms do you support out-of-the-box?',
        answer: 'PricePilot AI integrates with popular platforms and marketplaces, plus it can ingest data via CSV or custom API connections.',
        category: 'Integrations'
    },
    {
        question: 'What is Explainable AI (XAI) and why does it matter?',
        answer: 'Explainable AI provides transparent insights into pricing decisions so you can trust the recommendations and understand the drivers behind each price change.',
        category: 'Pricing & AI'
    },
    {
        question: 'How frequently does the algorithm update my product prices?',
        answer: 'The algorithm can refresh prices in near real-time based on competitor moves, demand signals, and predefined business rules.',
        category: 'Pricing & AI'
    }
];

const teamMembers = [
    {
        name: 'Aryan Desale',
        role: 'Design & Frontend Engineering',
        linkedin: 'https://www.linkedin.com/in/aryan-desale-18330a377'
    },
    {
        name: 'Rudra Babar',
        role: 'Backend & AI Systems Architecture',
        linkedin: 'http://www.linkedin.com/in/rudra-babar-8594a8379'
    }
];

const integrationLogos = [
    { name: 'Shopify', icon: SiShopify },
    { name: 'Stripe', icon: SiStripe },
    { name: 'WooCommerce', icon: SiWoocommerce },
    { name: 'Amazon', icon: SiAmazon },
];

const FaqAccordionItem = memo(function FaqAccordionItem({ faq, isOpen, onClick }) {
    return (
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#0B1120]/80 backdrop-blur-xl overflow-hidden hover:border-indigo-500/40 hover:shadow-lg">
            <button
                type="button"
                onClick={onClick}
                className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
            >
                <span className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {faq.question}
                </span>
                <span
                    className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-lg text-indigo-600 dark:text-indigo-300 transition-transform duration-300 ${
                        isOpen ? 'rotate-45' : ''
                    }`}
                >
                    +
                </span>
            </button>

            <div
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-6">
                        <div className="border-t border-slate-200 dark:border-white/10 pt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            {faq.answer}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default function Landing() {
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All Questions');
    const [searchTerm, setSearchTerm] = useState('');
    const [activePipelineStep, setActivePipelineStep] = useState(0);

    const toggleFaq = useCallback((index) => {
        setOpenFaqIndex(prev => prev === index ? null : index);
    }, []);

    const filteredFaqs = useMemo(() => {
        return faqData.filter((faq) => {
            const matchesCategory = activeCategory === 'All Questions' || faq.category === activeCategory;
            const matchesSearch =
                searchTerm.trim() === '' ||
                faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchTerm]);

    const pipelineSteps = [
        {
            step: '01',
            title: 'Multi-Signal Data Ingestion',
            badge: 'Scraping + API',
            desc: 'Continuous real-time ingestion of competitor catalog prices, Google Trends search intensity, and live inventory levels.',
            metric: '350+ Signals/min',
        },
        {
            step: '02',
            title: 'Deterministic Elasticity Engine',
            badge: 'ML Elasticity',
            desc: 'Binary search optimization paired with log-linear demand modeling to calculate profit-maximizing price equilibrium.',
            metric: 'e = -1.85 Curve',
        },
        {
            step: '03',
            title: 'Google Gemini Explainable AI',
            badge: 'XAI Reasoning',
            desc: 'Natural language executive explanations provide instant transparency behind every single price recommendation.',
            metric: '100% Auditable',
        },
        {
            step: '04',
            title: 'Autonomous Storefront Sync',
            badge: 'Instant Execution',
            desc: 'Automatic two-way synchronization updates price points across Shopify, Amazon, and WooCommerce with zero manual latency.',
            metric: '< 150ms Sync',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500/20 selection:text-indigo-950 dark:selection:bg-indigo-500/30 dark:selection:text-white relative overflow-x-hidden font-sans">
            {/* Ambient Background Grid and Atmosphere */}
            <div className="fixed inset-0 bg-grid-dark pointer-events-none opacity-40 dark:opacity-30 z-0" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-indigo-200/40 via-sky-100/30 to-transparent dark:from-indigo-500/10 dark:via-cyan-500/5 dark:to-transparent blur-[120px] pointer-events-none z-0" />

            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#070B14]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Brand Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1.5 shadow-sm group-hover:border-indigo-500/50 transition-colors">
                                <img src={newDarkLogo} alt="PricePilot AI Logo" className="w-full h-full object-contain drop-shadow-sm hidden dark:block" />
                                <img src={newLightLogo} alt="PricePilot AI Logo" className="w-full h-full object-contain drop-shadow-sm block dark:hidden" />
                            </div>
                            <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white">
                                PricePilot <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                            </span>
                        </Link>

                        {/* Navigation Links & Actions */}
                        <div className="flex items-center space-x-2 sm:space-x-6">
                            <nav className="hidden md:flex items-center space-x-6">
                                <Link to="/docs" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors text-sm font-medium">
                                    Docs
                                </Link>
                                <a href="#features" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors text-sm font-medium">
                                    Features
                                </a>
                                <a href="#pipeline" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors text-sm font-medium">
                                    Architecture
                                </a>
                                <a href="#faq" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors text-sm font-medium">
                                    FAQ
                                </a>
                                <a href="#about" className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors text-sm font-medium">
                                    About
                                </a>
                            </nav>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <Link to="/login" className="text-slate-700 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white text-sm font-medium px-3 py-2 rounded-lg dark:hover:bg-white/5 transition-colors">
                                    Sign In
                                </Link>

                                {/* Isolated Theme Toggle Button */}
                                <ThemeToggle />

                                {/* Primary CTA */}
                                <Link
                                    to="/register"
                                    className="btn-primary py-2 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col pt-28 pb-20 relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Hero Section */}
                <section className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-20 min-h-[calc(100dvh-10rem)]">
                    {/* Left Column: Value Prop & CTAs */}
                    <div className="lg:col-span-6 text-center lg:text-left flex flex-col items-center lg:items-start animate-fade-in">
                        {/* Status Eyebrow Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-500"></span>
                            </span>
                            <span>PricePilot 1.0 Live</span>
                            <span className="text-slate-400 dark:text-slate-500">|</span>
                            <span className="text-slate-600 dark:text-slate-300">Autonomous Pricing</span>
                        </div>

                        {/* Display Headline */}
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
                            Dynamic Pricing.<br />
                            <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 dark:from-indigo-400 dark:via-sky-300 dark:to-emerald-400 bg-clip-text text-transparent">
                                Engineered for Profit.
                            </span>
                        </h1>

                        {/* Value Prop Subtext */}
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">
                            Autonomous elasticity modeling, real-time competitor tracking, and explainable AI to protect margins and accelerate revenue.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
                            <Link 
                                to="/register" 
                                className="btn-primary text-sm sm:text-base px-7 py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                            >
                                <span>Start Optimizing Now</span>
                                <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                            <Link 
                                to="/demo" 
                                className="btn-secondary text-sm sm:text-base px-6 py-3 rounded-xl flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700/60 hover:border-indigo-500/40 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-slate-800 dark:text-slate-200 shadow-sm"
                            >
                                <span>Live Sandbox</span>
                                <span className="text-xs text-indigo-600 dark:text-indigo-400">→</span>
                            </Link>
                        </div>

                        {/* Quick Trust Highlights */}
                        <div className="mt-8 flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>5-minute catalog sync</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Hero Live Pricing Terminal Preview */}
                    <div className="lg:col-span-6 w-full flex justify-center lg:justify-end animate-slide-up">
                        <HeroDashboard />
                    </div>
                </section>

                {/* Social Proof & Integration Logo Bar */}
                <section className="py-8 border-y border-slate-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-transparent mb-24 relative transition-colors duration-300">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center md:text-left">
                            Seamless 2-Way Sync Across Modern Commerce Platforms
                        </span>

                        <div className="flex items-center gap-8 sm:gap-12 flex-wrap justify-center opacity-85 hover:opacity-100 transition-opacity">
                            {integrationLogos.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <div key={item.name} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                                        <IconComponent className="w-6 h-6" />
                                        <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Asymmetric Bento Intelligence Suite */}
                <section id="features" className="max-w-7xl w-full mx-auto mb-28">
                    <div className="text-center md:text-left mb-12">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
                            <HiOutlineLightningBolt className="w-4 h-4" />
                            Core Intelligence Suite
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Engineered for Precision and Margin Protection
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
                            Replace arbitrary guesswork with deterministic price elasticity models, multi-signal demand forecasts, and transparent generative AI reasoning.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                        {/* Large Bento Card (7 Columns): Dynamic Margin Engine */}
                        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl p-8 sm:p-10 flex flex-col justify-between shadow-xl dark:shadow-2xl hover:border-indigo-500/30 transition-all duration-300">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shadow-sm">
                                        <HiOutlineLightningBolt className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 font-mono">
                                        Deterministic + ML
                                    </span>
                                </div>

                                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-3">
                                    Real-Time Price Elasticity and Margin Optimization
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 text-sm sm:text-base">
                                    Binary search margin optimization paired with dynamic log-linear elasticity models to pinpoint the exact price where revenue and profit curves maximize.
                                </p>

                                {/* Micro visualizer inside the card */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Elasticity Curve (e = -1.85)</span>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">+18.4% Projected Margin</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-full w-[78%] rounded-full" />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                        <span>COGS: ₹840</span>
                                        <span className="font-bold text-slate-900 dark:text-white">Optimal Price: ₹1,299</span>
                                        <span>Competitor: ₹1,349</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Simulate pricing across 10,000+ catalog SKUs
                                </span>
                                <Link 
                                    to="/demo" 
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-5 text-xs font-bold transition-all shadow-md shadow-indigo-500/20 text-center flex items-center justify-center gap-1.5"
                                >
                                    <span>Try What-If Simulator</span>
                                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Right Stacked Bento Cards (5 Columns) */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            {/* Card A: Multi-Signal Demand */}
                            <div className="rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl p-7 flex flex-col justify-between shadow-xl dark:shadow-2xl hover:border-purple-500/30 transition-all duration-300 flex-1">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
                                            <HiOutlineCubeTransparent className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 font-mono">
                                            Prophet Forecasts
                                        </span>
                                    </div>
                                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        Multi-Signal Demand Intelligence
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                        Forecast sales velocity combining historical checkout patterns with Google Trends search volumes, seasonal trends, and competitor stockouts.
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                                    <Link to="/docs" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 inline-flex items-center gap-1">
                                        <span>View Documentation</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Card B: Explainable AI */}
                            <div className="rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl p-7 flex flex-col justify-between shadow-xl dark:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 flex-1">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                                            <HiOutlineShieldCheck className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 font-mono">
                                            Google Gemini XAI
                                        </span>
                                    </div>
                                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        Explainable AI (XAI)
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                        Never guess why an algorithm made a recommendation. Natural language executive summaries outline the exact market signals driving every rupee change.
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                                    <Link to="/docs" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1">
                                        <span>Explore XAI Framework</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dynamic Engine Architecture Pipeline */}
                <section id="pipeline" className="max-w-7xl w-full mx-auto mb-28">
                    <div className="rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-slate-950/80 backdrop-blur-2xl p-8 sm:p-12 relative overflow-hidden shadow-xl dark:shadow-2xl transition-colors duration-300">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-3">
                                <HiOutlineSparkles className="w-4 h-4" />
                                Autonomous Execution Pipeline
                            </div>
                            <h2 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                How PricePilot Generates Maximum Margin
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                                From competitor price scraping to automated catalog checkout synchronization.
                            </p>
                        </div>

                        {/* Pipeline Steps Grid */}
                        <div className="grid md:grid-cols-4 gap-4 sm:gap-6 relative">
                            {pipelineSteps.map((item, index) => (
                                <div
                                    key={item.step}
                                    onClick={() => setActivePipelineStep(index)}
                                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                        activePipelineStep === index
                                            ? 'bg-indigo-50/90 dark:bg-slate-900/90 border-indigo-500/60 shadow-lg shadow-indigo-500/10 -translate-y-1'
                                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            {item.step}
                                        </span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium">
                                            {item.badge}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                        {item.desc}
                                    </p>
                                    <div className="pt-3 border-t border-slate-200 dark:border-white/5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
                                        <span>Status:</span>
                                        <span>{item.metric}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Research & Economic Insights */}
                <section className="max-w-7xl w-full mx-auto mb-28 border-t border-slate-200/80 dark:border-white/[0.08] pt-16 transition-colors duration-300">
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
                        <div>
                            <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2">
                                Research and Policy
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
                                Building autonomous pricing algorithms for sustainable long-term profitability.
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 leading-relaxed max-w-md">
                                Read our foundational research on algorithmic price elasticity, model interpretability, and market fairness guidelines.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { title: 'Core Principles on Algorithmic Pricing Safety', category: 'Announcements' },
                                { title: 'PricePilot Responsible Scaling and Anti-Collusion Policy', category: 'Alignment Science' },
                                { title: 'PricePilot Academy: Elasticity Math and Prophet Forecasting', category: 'Education' },
                                { title: 'Quarterly E-Commerce Macroeconomic Index', category: 'Market Research' },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/80 hover:border-indigo-500/30 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                                >
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                            {item.title}
                                        </h4>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">{item.category}</span>
                                    </div>
                                    <span className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors text-sm">→</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="max-w-7xl w-full mx-auto mb-28">
                    <div className="grid gap-8 lg:grid-cols-[340px_1fr] items-start">
                        {/* Left Search & Categories Sidebar */}
                        <div className="rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl dark:shadow-2xl transition-colors duration-300">
                            <span className="inline-flex items-center rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-6 font-mono">
                                FAQ Helpdesk
                            </span>

                            <h2 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Got Questions?</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                Everything you need to know about our dynamic price optimization engine, real-time tracking, and data security.
                            </p>

                            {/* Search Box */}
                            <div className="mb-6">
                                <label htmlFor="faq-search" className="sr-only">Search FAQ</label>
                                <div className="relative">
                                    <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        id="faq-search"
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search answers..."
                                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/40 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Filter Buttons */}
                            <div className="space-y-2">
                                {faqCategories.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveCategory(item)}
                                        className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                                            activeCategory === item
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Accordion List */}
                        <div className="space-y-3.5">
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, index) => (
                                    <FaqAccordionItem
                                        key={faq.question}
                                        faq={faq}
                                        isOpen={openFaqIndex === index}
                                        onClick={() => toggleFaq(index)}
                                    />
                                ))
                            ) : (
                                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-10 text-center text-slate-500 dark:text-slate-400">
                                    No questions match your search. Try another keyword or category.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* About Us & Engineering Team Section */}
                <section id="about" className="max-w-4xl w-full mx-auto mb-20">
                    <div className="rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-12 shadow-xl dark:shadow-2xl text-center transition-colors duration-300">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 p-3 shadow-inner flex items-center justify-center mb-6">
                            <img src={newDarkLogo} alt="PricePilot Logo" className="w-full h-full object-contain drop-shadow-sm hidden dark:block" />
                            <img src={newLightLogo} alt="PricePilot Logo" className="w-full h-full object-contain drop-shadow-sm block dark:hidden" />
                        </div>

                        <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                            PricePilot AI Engineering Team
                        </h3>

                        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
                            PricePilot AI was built as a full-stack engineering initiative to deliver enterprise-grade dynamic price optimization, machine learning forecasting, and explainable AI to modern merchants.
                        </p>

                        {/* Team Profile Cards */}
                        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                            {teamMembers.map((member) => (
                                <div
                                    key={member.name}
                                    className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 text-center hover:border-indigo-500/40 transition-all shadow-sm"
                                >
                                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-sm font-bold text-white mb-3 shadow-md">
                                        {member.name.split(' ').map((n) => n[0]).join('')}
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{member.name}</h4>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-3 font-medium">{member.role}</p>
                                    <a
                                        href={member.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors font-medium"
                                    >
                                        <FaLinkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                                        <span>LinkedIn Profile</span>
                                    </a>
                                </div>
                            ))}
                        </div>

                        {/* Verified GitHub Repository Badge */}
                        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://github.com/rb-369/Price-Pilot-Ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:border-indigo-500/40 hover:bg-slate-200/80 dark:hover:bg-white/10 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                            >
                                <FaGithub className="w-4 h-4 text-slate-900 dark:text-white" />
                                <span>rb-369/Price-Pilot-Ai</span>
                            </a>
                            <a
                                href="mailto:pricepilot5@gmail.com"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:border-indigo-500/40 hover:bg-slate-200/80 dark:hover:bg-white/10 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm"
                            >
                                <HiOutlineMail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>pricepilot5@gmail.com</span>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Back to Top Floating Button */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 z-50 px-4 py-2.5 rounded-full bg-white/90 dark:bg-[#0B1120]/95 border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-white transition-all backdrop-blur-xl"
                    aria-label="Back to Top"
                >
                    <HiOutlineArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Top</span>
                </button>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full bg-slate-100 dark:bg-[#050810] border-t border-slate-200 dark:border-white/[0.08] py-14 text-slate-600 dark:text-slate-400 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 flex items-center justify-center shadow-sm">
                                <img src={newDarkLogo} alt="Logo" className="w-full h-full object-contain hidden dark:block" />
                                <img src={newLightLogo} alt="Logo" className="w-full h-full object-contain block dark:hidden" />
                            </div>
                            <span className="font-display font-bold text-lg text-slate-900 dark:text-white">PricePilot AI</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-xs leading-relaxed mb-4">
                            Autonomous dynamic pricing, Prophet demand forecasting, and Google Gemini XAI for high-growth e-commerce merchants.
                        </p>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[11px] font-mono font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                            <span>All Systems Operational</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4">Products</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><Link to="/demo" className="hover:text-slate-900 dark:hover:text-white transition-colors">Live Demo</Link></li>
                            <li><Link to="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">Documentation</Link></li>
                            <li><a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Intelligence Suite</a></li>
                            <li><a href="#pipeline" className="hover:text-slate-900 dark:hover:text-white transition-colors">Architecture</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4">Company</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><a href="#about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Team</a></li>
                            <li><a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition-colors">FAQ</a></li>
                            <li><a href="https://github.com/rb-369/Price-Pilot-Ai" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub Repository</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4">Legal</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <p>&copy; {new Date().getFullYear()} PricePilot AI. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <a href="https://github.com/rb-369/Price-Pilot-Ai" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                            <FaGithub className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}