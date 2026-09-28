import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineLightningBolt,
    HiOutlineCubeTransparent,
    HiOutlineShieldCheck,
    HiOutlineMail,
    HiOutlineArrowUp,
    HiOutlineChip,
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
import StackingCards from '../components/ui/stacking-card';
import { warmupAIService } from '../utils/aiWarmup';

const faqCategories = ['All Questions', 'Pricing & AI', 'Security & Privacy', 'Integrations'];

const TypewriterEffect = ({ text }) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayText(text.slice(0, i + 1));
            i++;
            if (i >= text.length) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
    }, [text]);

    return (
        <span className="inline-flex items-center">
            <span className="bg-gradient-to-r from-[#8C4630] via-[#A85A3C] to-[#C87D55] dark:from-[#C87D55] dark:via-[#D98A66] dark:to-[#F0B094] bg-clip-text text-transparent">
                {displayText}
            </span>
            <span className="inline-block w-[3px] h-[0.9em] ml-1.5 bg-[#C87D55] dark:bg-[#F0B094] animate-pulse"></span>
        </span>
    );
};

const teamMembers = [
    {
        name: 'Aryan Desale',
        role: 'Full-Stack & Backend Systems Lead',
        linkedin: 'https://www.linkedin.com/in/aryan-desale-46603a27a/',
    },
    {
        name: 'Rudra Babar',
        role: 'AI / Machine Learning & Architecture Lead',
        linkedin: 'https://www.linkedin.com/in/rudrababar/',
    },
];

const faqData = [
    {
        category: 'Pricing & AI',
        question: 'How does the dynamic elasticity algorithm calculate optimal price points?',
        answer: 'PricePilot runs dynamic log-linear regression against historical sales velocities, competitor scrape data, and promotional seasonality. A binary search optimizer converges on the price equilibrium that maximizes gross margin rather than just gross volume.',
    },
    {
        category: 'Pricing & AI',
        question: 'What is Google Gemini Explainable AI (XAI) and why does it matter?',
        answer: 'Instead of treating machine learning recommendations as black boxes, Gemini XAI generates audit-ready natural language rationales. It clearly explains the market signals, competitor actions, and demand elasticity metrics that justified every single price recommendation.',
    },
    {
        category: 'Integrations',
        question: 'Can PricePilot sync price updates directly to Shopify, WooCommerce, or Amazon?',
        answer: 'Yes. PricePilot provides native REST and webhook integrations that synchronize updated price points back into your merchant catalog with sub-second execution speeds, eliminating manual CSV uploads.',
    },
    {
        category: 'Security & Privacy',
        question: 'Is competitor price scraping legal and compliant with rate limits?',
        answer: 'All external market benchmarks are retrieved using distributed proxy networks with automated rate limiting and robots.txt compliance. We only collect publicly visible retail pricing data.',
    },
    {
        category: 'Pricing & AI',
        question: 'Can I set guardrails such as minimum floor and maximum ceiling prices?',
        answer: 'Absolutely. Merchant safeguards allow you to configure hard margin floors (e.g. minimum 18% net margin) and ceiling bounds to protect brand equity and avoid destructive price wars.',
    },
    {
        category: 'Integrations',
        question: 'How fast can our engineering team get started with the sandbox API?',
        answer: 'You can test recommendations immediately via our interactive Swagger API portal. Simply submit sample SKU cost, current price, and competitor benchmarks to receive instant optimized price payloads.',
    },
    {
        category: 'Security & Privacy',
        question: 'How is store catalog data secured?',
        answer: 'All catalog and transaction data is encrypted both in transit (TLS 1.3) and at rest (AES-256). Enterprise multi-tenant isolation ensures your proprietary margins and sales figures remain completely private.',
    },
];

const integrationLogos = [
    { name: 'Shopify', icon: SiShopify },
    { name: 'Stripe', icon: SiStripe },
    { name: 'WooCommerce', icon: SiWoocommerce },
    { name: 'Amazon', icon: SiAmazon },
];

const FaqAccordionItem = memo(function FaqAccordionItem({ faq, isOpen, onClick }) {
    return (
        <div className="rounded-2xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] backdrop-blur-xl overflow-hidden hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 hover:shadow-lg transition-all">
            <button
                type="button"
                onClick={onClick}
                className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
            >
                <span className="text-base sm:text-lg font-semibold text-[#3D1F12] dark:text-[#F0EEE6]">
                    {faq.question}
                </span>
                <span
                    className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#3D1F12]/5 dark:bg-[#30251F] border border-[#3D1F12]/15 dark:border-[#4A3930] text-lg text-[#3D1F12] dark:text-[#F0EEE6] transition-transform duration-300 ${isOpen ? 'rotate-45' : ''
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
                        <div className="border-t border-[#3D1F12]/10 dark:border-[#4A3930] pt-4 text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 text-sm leading-relaxed">
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

    useEffect(() => {
        warmupAIService();
    }, []);

    const toggleFaq = useCallback((index) => {
        setOpenFaqIndex(prev => prev === index ? null : index);
    }, []);

    const filteredFaqs = useMemo(() => {
        return faqData.filter((faq) => {
            const matchesCategory = activeCategory === 'All Questions' || faq.category === activeCategory;
            const matchesSearch =
                faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchTerm]);

    const pipelineProjects = [
        {
            title: 'Real-Time Competitor Ingestion',
            description: 'Scrapes live market benchmarks, competitor stock levels, and price promotions across marketplaces every 60 seconds.',
            badge: 'Scraping + API',
            metric: '350+ Signals/min',
            link: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
            color: '#2D211B',
        },
        {
            title: 'Deterministic Elasticity Engine',
            description: 'Binary search optimization paired with log-linear demand modeling to calculate profit-maximizing price equilibrium.',
            badge: 'ML Elasticity',
            metric: 'e = -1.85 Curve',
            link: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop',
            color: '#382B23',
        },
        {
            title: 'Google Gemini Explainable AI',
            description: 'Natural language executive explanations provide instant transparency behind every single price recommendation.',
            badge: 'XAI Reasoning',
            metric: '100% Auditable',
            link: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop',
            color: '#30251F',
        },
        {
            title: 'Autonomous Storefront Sync',
            description: 'Automatic two-way synchronization updates price points across Shopify, Amazon, and WooCommerce with zero manual latency.',
            badge: 'Instant Execution',
            metric: '< 150ms Sync',
            link: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop',
            color: '#261C16',
        },
    ];

    return (
        <div className="min-h-screen bg-[#F0EEE6] dark:bg-[#241812] text-[#3D1F12] dark:text-[#F0EEE6] flex flex-col selection:bg-[#3D1F12]/20 dark:selection:bg-[#A85A3C]/30 selection:text-[#3D1F12] dark:selection:text-[#F0EEE6] relative overflow-x-clip font-sans transition-colors duration-300">
            {/* Ambient Atmosphere */}
            <div className="fixed inset-0 bg-grid-dark pointer-events-none opacity-20 dark:opacity-10 z-0" />
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#3D1F12]/5 dark:from-[#A85A3C]/10 to-transparent blur-[120px] pointer-events-none z-0" />

            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#F0EEE6]/90 dark:bg-[#241812]/90 backdrop-blur-xl border-b border-[#3D1F12]/10 dark:border-[#4A3930] transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Brand Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#3D1F12]/5 dark:bg-[#2D211B] border border-[#3D1F12]/15 dark:border-[#4A3930] p-1.5 shadow-sm group-hover:border-[#3D1F12]/40 dark:group-hover:border-[#A85A3C]/50 transition-colors">
                                <img src={newDarkLogo} alt="PricePilot AI Logo" className="w-full h-full object-contain drop-shadow-sm hidden dark:block" />
                                <img src={newLightLogo} alt="PricePilot AI Logo" className="w-full h-full object-contain drop-shadow-sm block dark:hidden" />
                            </div>
                            <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-[#3D1F12] dark:text-[#F0EEE6]">
                                PricePilot <span className="text-[#3D1F12] dark:text-[#F0EEE6]">AI</span>
                            </span>
                        </Link>

                        {/* Navigation Links & Actions */}
                        <div className="flex items-center space-x-2 sm:space-x-6">
                            <nav className="hidden md:flex items-center space-x-6">
                                <Link to="/docs" className="text-[#3D1F12]/80 dark:text-[#F0EEE6]/80 hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors text-sm font-medium">
                                    Docs
                                </Link>
                                <a href="#features" className="text-[#3D1F12]/80 dark:text-[#F0EEE6]/80 hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors text-sm font-medium">
                                    Features
                                </a>
                                <a href="#pipeline" className="text-[#3D1F12]/80 dark:text-[#F0EEE6]/80 hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors text-sm font-medium">
                                    Architecture
                                </a>
                                <a href="#faq" className="text-[#3D1F12]/80 dark:text-[#F0EEE6]/80 hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors text-sm font-medium">
                                    FAQ
                                </a>
                                <a href="#about" className="text-[#3D1F12]/80 dark:text-[#F0EEE6]/80 hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors text-sm font-medium">
                                    About
                                </a>
                            </nav>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <Link to="/login" className="text-[#3D1F12]/80 dark:text-[#F0EEE6]/80 hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] hover:bg-[#3D1F12]/5 dark:hover:bg-white/5 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                                    Sign In
                                </Link>

                                {/* Theme Toggle */}
                                <ThemeToggle />

                                {/* Primary CTA Button */}
                                <Link
                                    to="/register"
                                    className="bg-[#3D1F12] hover:bg-[#2c160d] dark:bg-[#A85A3C] dark:hover:bg-[#8C4630] text-white py-2 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-[#3D1F12]/20 dark:shadow-[#A85A3C]/20 transition-all"
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
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3D1F12]/10 dark:bg-[#2D211B] border border-[#3D1F12]/20 dark:border-[#4A3930] text-[#3D1F12] dark:text-[#F0EEE6] text-xs font-semibold mb-6 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3D1F12] dark:bg-[#4C7C5C] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3D1F12] dark:bg-[#4C7C5C]"></span>
                            </span>
                            <span>PricePilot 1.0 Live</span>
                            <span className="text-[#3D1F12]/30 dark:text-[#F0EEE6]/30">|</span>
                            <span className="text-[#3D1F12]/80 dark:text-[#F0EEE6]/80">Autonomous Pricing</span>
                        </div>

                        {/* Display Headline */}
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#3D1F12] dark:text-[#F0EEE6] leading-[1.1] mb-6">
                            Dynamic Pricing.<br />
                            <TypewriterEffect text="Engineered for Profit." />
                        </h1>

                        {/* Value Prop Subtext */}
                        <p className="text-base sm:text-lg text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 mb-8 max-w-lg leading-relaxed">
                            Autonomous elasticity modeling, real-time competitor tracking, and explainable AI to protect margins and accelerate revenue.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
                            <Link
                                to="/register"
                                className="bg-[#3D1F12] hover:bg-[#2c160d] dark:bg-[#A85A3C] dark:hover:bg-[#8C4630] text-white text-sm sm:text-base px-7 py-3 rounded-xl shadow-lg shadow-[#3D1F12]/20 dark:shadow-[#A85A3C]/20 flex items-center justify-center gap-2 transition-all font-semibold"
                            >
                                <span>Start Optimizing Now</span>
                                <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/demo"
                                className="text-sm sm:text-base px-6 py-3 rounded-xl flex items-center justify-center gap-2 border border-[#3D1F12]/20 dark:border-[#4A3930] hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 bg-white/80 dark:bg-[#2D211B] hover:bg-white dark:hover:bg-[#352720] transition-all text-[#3D1F12] dark:text-[#F0EEE6] shadow-sm font-semibold"
                            >
                                <span>Live Sandbox</span>
                                <span className="text-xs text-[#A85A3C]">→</span>
                            </Link>
                        </div>

                        {/* Quick Trust Highlights */}
                        <div className="mt-8 flex items-center gap-6 text-xs text-[#3D1F12]/60 dark:text-[#A99D91]">
                            <div className="flex items-center gap-1.5">
                                <HiOutlineCheckCircle className="w-4 h-4 text-[#A85A3C]" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <HiOutlineCheckCircle className="w-4 h-4 text-[#A85A3C]" />
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
                <section className="py-8 border-y border-[#3D1F12]/10 dark:border-[#4A3930] bg-[#3D1F12]/5 dark:bg-white/5 mb-24 relative transition-colors duration-300">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                        <span className="text-xs font-semibold text-[#3D1F12]/60 dark:text-[#A99D91] uppercase tracking-wider text-center md:text-left">
                            Seamless 2-Way Sync Across Modern Commerce Platforms
                        </span>

                        <div className="flex items-center gap-8 sm:gap-12 flex-wrap justify-center opacity-85 hover:opacity-100 transition-opacity">
                            {integrationLogos.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <div key={item.name} className="flex items-center gap-2 text-[#3D1F12]/75 hover:text-[#3D1F12] dark:text-[#F0EEE6]/75 dark:hover:text-[#F0EEE6] transition-colors">
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
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3D1F12]/10 dark:bg-[#2D211B] border border-[#3D1F12]/20 dark:border-[#4A3930] text-[#3D1F12] dark:text-[#F0EEE6] text-xs font-bold uppercase tracking-wider mb-3">
                            <HiOutlineLightningBolt className="w-4 h-4 text-[#A85A3C]" />
                            Core Intelligence Suite
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#3D1F12] dark:text-[#F0EEE6] tracking-tight">
                            Engineered for Precision and Margin Protection
                        </h2>
                        <p className="text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
                            Replace arbitrary guesswork with deterministic price elasticity models, multi-signal demand forecasts, and transparent generative AI reasoning.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                        {/* Large Bento Card (7 Columns): Dynamic Margin Engine */}
                        <div className="lg:col-span-7 rounded-3xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] backdrop-blur-xl p-8 sm:p-10 flex flex-col justify-between shadow-xl dark:shadow-2xl hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 transition-all duration-300">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-[#3D1F12]/5 dark:bg-[#30251F] border border-[#3D1F12]/15 dark:border-[#4A3930] text-[#A85A3C] flex items-center justify-center text-xl shadow-sm">
                                        <HiOutlineLightningBolt className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#3D1F12]/10 dark:bg-[#30251F] text-[#3D1F12] dark:text-[#F0EEE6] border border-[#3D1F12]/20 dark:border-[#4A3930] font-mono">
                                        Deterministic + ML
                                    </span>
                                </div>

                                <h3 className="font-display text-2xl font-bold text-[#3D1F12] dark:text-[#F0EEE6] mb-3">
                                    Real-Time Price Elasticity and Margin Optimization
                                </h3>
                                <p className="text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 leading-relaxed mb-6 text-sm sm:text-base">
                                    Binary search margin optimization paired with dynamic log-linear elasticity models to pinpoint the exact price where revenue and profit curves maximize.
                                </p>

                                {/* Micro visualizer inside the card */}
                                <div className="p-4 rounded-2xl bg-[#FAF6F0] dark:bg-[#241812] border border-[#3D1F12]/15 dark:border-[#4A3930] space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-[#3D1F12] dark:text-[#F0EEE6]">Elasticity Curve (e = -1.85)</span>
                                        <span className="font-bold text-[#A85A3C]">+18.4% Projected Margin</span>
                                    </div>
                                    <div className="w-full bg-[#3D1F12]/10 dark:bg-[#30251F] h-2 rounded-full overflow-hidden">
                                        <div className="bg-[#A85A3C] h-full w-[78%] rounded-full" />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-[#3D1F12]/60 dark:text-[#A99D91] font-mono">
                                        <span>COGS: ₹840</span>
                                        <span className="font-bold text-[#3D1F12] dark:text-[#F0EEE6]">Optimal Price: ₹1,299</span>
                                        <span>Competitor: ₹1,349</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#3D1F12]/15 dark:border-[#4A3930] flex flex-col sm:flex-row items-center justify-between gap-4">
                                <span className="text-xs text-[#3D1F12]/60 dark:text-[#A99D91]">
                                    Simulate pricing across 10,000+ catalog SKUs
                                </span>
                                <Link
                                    to="/demo"
                                    className="w-full sm:w-auto bg-[#3D1F12] hover:bg-[#2c160d] dark:bg-[#A85A3C] dark:hover:bg-[#8C4630] text-white rounded-xl py-2.5 px-5 text-xs font-bold transition-all shadow-md shadow-[#3D1F12]/20 dark:shadow-[#A85A3C]/20 text-center flex items-center justify-center gap-1.5"
                                >
                                    <span>Try What-If Simulator</span>
                                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Right Stacked Bento Cards (5 Columns) */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            {/* Card A: Multi-Signal Demand */}
                            <div className="rounded-3xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] backdrop-blur-xl p-7 flex flex-col justify-between shadow-xl dark:shadow-2xl hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 transition-all duration-300 flex-1">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#3D1F12]/5 dark:bg-[#30251F] border border-[#3D1F12]/15 dark:border-[#4A3930] text-[#A85A3C] flex items-center justify-center text-lg">
                                            <HiOutlineCubeTransparent className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#3D1F12]/10 dark:bg-[#30251F] text-[#3D1F12] dark:text-[#F0EEE6] border border-[#3D1F12]/20 dark:border-[#4A3930] font-mono">
                                            Prophet Forecasts
                                        </span>
                                    </div>
                                    <h3 className="font-display text-lg font-bold text-[#3D1F12] dark:text-[#F0EEE6] mb-2">
                                        Multi-Signal Demand Intelligence
                                    </h3>
                                    <p className="text-xs text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 leading-relaxed mb-4">
                                        Forecast sales velocity combining historical checkout patterns with Google Trends search volumes, seasonal trends, and competitor stockouts.
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-[#3D1F12]/15 dark:border-[#4A3930] flex justify-between items-center">
                                    <Link to="/docs" className="text-xs font-bold text-[#A85A3C] dark:text-[#B8734F] hover:underline inline-flex items-center gap-1">
                                        <span>View Documentation</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Card B: Explainable AI */}
                            <div className="rounded-3xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] backdrop-blur-xl p-7 flex flex-col justify-between shadow-xl dark:shadow-2xl hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 transition-all duration-300 flex-1">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#3D1F12]/5 dark:bg-[#30251F] border border-[#3D1F12]/15 dark:border-[#4A3930] text-[#A85A3C] flex items-center justify-center text-lg">
                                            <HiOutlineShieldCheck className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#3D1F12]/10 dark:bg-[#30251F] text-[#3D1F12] dark:text-[#F0EEE6] border border-[#3D1F12]/20 dark:border-[#4A3930] font-mono">
                                            Google Gemini XAI
                                        </span>
                                    </div>
                                    <h3 className="font-display text-lg font-bold text-[#3D1F12] dark:text-[#F0EEE6] mb-2">
                                        Explainable AI (XAI)
                                    </h3>
                                    <p className="text-xs text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 leading-relaxed mb-4">
                                        Never guess why an algorithm made a recommendation. Natural language executive summaries outline the exact market signals driving every rupee change.
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-[#3D1F12]/15 dark:border-[#4A3930] flex justify-between items-center">
                                    <Link to="/docs" className="text-xs font-bold text-[#3D1F12] dark:text-[#F0EEE6] hover:text-[#A85A3C] dark:hover:text-[#B8734F] hover:underline inline-flex items-center gap-1">
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
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3D1F12]/10 dark:bg-[#2D211B] border border-[#3D1F12]/20 dark:border-[#4A3930] text-[#3D1F12] dark:text-[#F0EEE6] text-xs font-bold uppercase tracking-wider mb-3">
                            <HiOutlineChip className="w-4 h-4 text-[#A85A3C]" />
                            Autonomous Execution Pipeline
                        </div>
                        <h2 className="font-display text-3xl font-extrabold text-[#3D1F12] dark:text-[#F0EEE6] tracking-tight">
                            How PricePilot Generates Maximum Margin
                        </h2>
                        <p className="text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 text-sm mt-2">
                            From competitor price scraping to automated catalog checkout synchronization. Scroll down! 👇
                        </p>
                    </div>

                    <StackingCards projects={pipelineProjects} />
                </section>

                {/* Research & Economic Insights */}
                <section className="max-w-7xl w-full mx-auto mb-28 border-t border-[#3D1F12]/15 dark:border-[#4A3930] pt-16 transition-colors duration-300">
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
                        <div>
                            <span className="text-xs font-bold font-mono text-[#3D1F12] dark:text-[#A99D91] uppercase tracking-widest block mb-2">
                                Research and Policy
                            </span>
                            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#3D1F12] dark:text-[#F0EEE6] leading-snug">
                                Building autonomous pricing algorithms for sustainable long-term profitability.
                            </h3>
                            <p className="text-[#3D1F12]/75 text-sm mt-4 leading-relaxed max-w-md">
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
                                    className="p-4 rounded-xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] hover:bg-white dark:hover:bg-[#352720] hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                                >
                                    <div>
                                        <h4 className="text-sm font-semibold text-[#3D1F12] dark:text-[#F0EEE6] group-hover:text-[#3D1F12] dark:group-hover:text-[#F0EEE6] transition-colors">
                                            {item.title}
                                        </h4>
                                        <span className="text-xs text-[#3D1F12]/60 dark:text-[#A99D91] mt-0.5 block">{item.category}</span>
                                    </div>
                                    <span className="text-[#3D1F12]/50 dark:text-[#F0EEE6]/50 group-hover:text-[#3D1F12] dark:group-hover:text-[#F0EEE6] transition-colors text-sm">→</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="max-w-7xl w-full mx-auto mb-28">
                    <div className="grid gap-8 lg:grid-cols-[340px_1fr] items-start">
                        {/* Left Search & Categories Sidebar */}
                        <div className="rounded-3xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] backdrop-blur-xl p-6 sm:p-8 shadow-lg transition-colors duration-300">
                            <span className="inline-flex items-center rounded-full border border-[#3D1F12]/20 dark:border-[#4A3930] bg-[#3D1F12]/10 dark:bg-[#30251F] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#3D1F12] dark:text-[#F0EEE6] mb-6 font-mono">
                                FAQ Helpdesk
                            </span>

                            <h2 className="font-display text-3xl font-extrabold text-[#3D1F12] dark:text-[#F0EEE6] mb-3">Got Questions?</h2>
                            <p className="text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 text-sm leading-relaxed mb-6">
                                Everything you need to know about our dynamic price optimization engine, real-time tracking, and data security.
                            </p>

                            {/* Search Box */}
                            <div className="mb-6">
                                <label htmlFor="faq-search" className="sr-only">Search FAQ</label>
                                <div className="relative">
                                    <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3D1F12]/50 dark:text-[#F0EEE6]/50 w-4 h-4" />
                                    <input
                                        id="faq-search"
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search answers..."
                                        className="w-full rounded-xl border border-[#3D1F12]/20 dark:border-[#4A3930] bg-white/80 dark:bg-[#241812] pl-10 pr-10 py-2.5 text-sm text-[#3D1F12] dark:text-[#F0EEE6] placeholder:text-[#3D1F12]/40 dark:placeholder:text-[#F0EEE6]/40 focus:border-[#3D1F12] dark:focus:border-[#A85A3C] focus:outline-none focus:ring-1 focus:ring-[#3D1F12] dark:focus:ring-[#A85A3C]"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3D1F12]/50 dark:text-[#F0EEE6]/50 hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] text-xs"
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
                                        className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${activeCategory === item
                                            ? 'bg-[#3D1F12] dark:bg-[#A85A3C] text-white shadow-md'
                                            : 'text-[#3D1F12]/80 dark:text-[#F0EEE6]/80 hover:bg-[#3D1F12]/10 dark:hover:bg-white/5'
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
                                <div className="rounded-2xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] p-10 text-center text-[#3D1F12]/60 dark:text-[#F0EEE6]/60">
                                    No questions match your search. Try another keyword or category.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* About Us & Engineering Team Section */}
                <section id="about" className="max-w-4xl w-full mx-auto mb-20">
                    <div className="rounded-3xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/80 dark:bg-[#2D211B] backdrop-blur-2xl p-8 sm:p-12 shadow-lg text-center transition-colors duration-300">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#3D1F12]/5 dark:bg-[#30251F] border border-[#3D1F12]/15 dark:border-[#4A3930] p-3 shadow-inner flex items-center justify-center mb-6">
                            <img src={newDarkLogo} alt="PricePilot Logo" className="w-full h-full object-contain drop-shadow-sm hidden dark:block" />
                            <img src={newLightLogo} alt="PricePilot Logo" className="w-full h-full object-contain drop-shadow-sm block dark:hidden" />
                        </div>

                        <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#3D1F12] dark:text-[#F0EEE6] mb-3">
                            PricePilot AI Engineering Team
                        </h3>

                        <p className="text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
                            PricePilot AI was built as a full-stack engineering initiative to deliver enterprise-grade dynamic price optimization, machine learning forecasting, and explainable AI to modern merchants.
                        </p>

                        {/* Team Profile Cards */}
                        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                            {teamMembers.map((member) => (
                                <div
                                    key={member.name}
                                    className="p-5 rounded-2xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/70 dark:bg-[#30251F] text-center hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 transition-all shadow-sm"
                                >
                                    <div className="w-12 h-12 mx-auto rounded-full bg-[#3D1F12] dark:bg-[#A85A3C] flex items-center justify-center text-sm font-bold text-white mb-3 shadow-md">
                                        {member.name.split(' ').map((n) => n[0]).join('')}
                                    </div>
                                    <h4 className="font-bold text-[#3D1F12] dark:text-[#F0EEE6] text-base">{member.name}</h4>
                                    <p className="text-xs text-[#3D1F12]/80 dark:text-[#A99D91] mb-3 font-medium">{member.role}</p>
                                    <a
                                        href={member.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 hover:text-[#3D1F12] dark:hover:text-[#A85A3C] transition-colors font-medium"
                                    >
                                        <FaLinkedin className="w-3.5 h-3.5 text-[#3D1F12] dark:text-[#F0EEE6]" />
                                        <span>LinkedIn Profile</span>
                                    </a>
                                </div>
                            ))}
                        </div>

                        {/* Verified GitHub Repository Badge */}
                        <div className="pt-6 border-t border-[#3D1F12]/15 dark:border-[#4A3930] flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://github.com/rb-369/Price-Pilot-Ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/60 dark:bg-[#30251F] hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 hover:bg-white dark:hover:bg-[#382B23] transition-all text-xs font-semibold text-[#3D1F12] dark:text-[#F0EEE6] shadow-sm"
                            >
                                <FaGithub className="w-4 h-4 text-[#3D1F12] dark:text-[#F0EEE6]" />
                                <span>rb-369/Price-Pilot-Ai</span>
                            </a>
                            <a
                                href="mailto:pricepilot5@gmail.com"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#3D1F12]/15 dark:border-[#4A3930] bg-white/60 dark:bg-[#30251F] hover:border-[#3D1F12]/40 dark:hover:border-[#A85A3C]/50 hover:bg-white dark:hover:bg-[#382B23] transition-all text-xs font-semibold text-[#3D1F12] dark:text-[#F0EEE6] shadow-sm"
                            >
                                <HiOutlineMail className="w-4 h-4 text-[#3D1F12] dark:text-[#F0EEE6]" />
                                <span>pricepilot5@gmail.com</span>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Back to Top Floating Button */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 z-50 px-4 py-2.5 rounded-full bg-white/95 dark:bg-[#2D211B]/95 border border-[#3D1F12]/20 dark:border-[#4A3930] shadow-xl flex items-center gap-2 text-xs font-semibold text-[#3D1F12] dark:text-[#F0EEE6] hover:border-[#3D1F12]/50 dark:hover:border-[#A85A3C] transition-all backdrop-blur-xl"
                    aria-label="Back to Top"
                >
                    <HiOutlineArrowUp className="w-3.5 h-3.5 text-[#3D1F12] dark:text-[#F0EEE6]" />
                    <span>Top</span>
                </button>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full bg-[#F0EEE6] dark:bg-[#1E140E] border-t border-[#3D1F12]/15 dark:border-[#4A3930] py-14 text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-[#3D1F12]/5 dark:bg-[#2D211B] border border-[#3D1F12]/15 dark:border-[#4A3930] p-1 flex items-center justify-center shadow-sm">
                                <img src={newDarkLogo} alt="Logo" className="w-full h-full object-contain hidden dark:block" />
                                <img src={newLightLogo} alt="Logo" className="w-full h-full object-contain block dark:hidden" />
                            </div>
                            <span className="font-display font-bold text-lg text-[#3D1F12] dark:text-[#F0EEE6]">PricePilot AI</span>
                        </div>
                        <p className="text-[#3D1F12]/75 dark:text-[#F0EEE6]/75 text-xs sm:text-sm max-w-xs leading-relaxed mb-4">
                            Autonomous dynamic pricing, Prophet demand forecasting, and Google Gemini XAI for high-growth e-commerce merchants.
                        </p>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#3D1F12]/10 dark:bg-[#2D211B] border border-[#3D1F12]/20 dark:border-[#4A3930] text-[#3D1F12] dark:text-[#F0EEE6] text-[11px] font-mono font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3D1F12] dark:bg-[#4C7C5C] animate-pulse"></span>
                            <span>All Systems Operational</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-[#3D1F12] dark:text-[#F0EEE6] text-xs uppercase tracking-wider mb-4">Products</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><Link to="/demo" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">Live Demo</Link></li>
                            <li><Link to="/docs" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">Documentation</Link></li>
                            <li><a href="#features" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">Intelligence Suite</a></li>
                            <li><a href="#pipeline" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">Architecture</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-[#3D1F12] dark:text-[#F0EEE6] text-xs uppercase tracking-wider mb-4">Company</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><a href="#about" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">About Team</a></li>
                            <li><a href="#faq" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">FAQ</a></li>
                            <li><a href="https://github.com/rb-369/Price-Pilot-Ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">GitHub Repository</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-[#3D1F12] dark:text-[#F0EEE6] text-xs uppercase tracking-wider mb-4">Legal</h4>
                        <ul className="space-y-2.5 text-xs">
                            <li><Link to="/privacy" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#3D1F12]/10 dark:border-[#4A3930] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#3D1F12]/60 dark:text-[#F0EEE6]/60">
                    <p>&copy; {new Date().getFullYear()} PricePilot AI. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <a href="https://github.com/rb-369/Price-Pilot-Ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#3D1F12] dark:hover:text-[#F0EEE6] transition-colors">
                            <FaGithub className="w-4 h-4 text-[#3D1F12] dark:text-[#F0EEE6]" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}