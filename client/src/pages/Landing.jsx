import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineChartBar, HiOutlineCubeTransparent, HiOutlineTrendingUp, HiOutlineShieldCheck, HiOutlineSun, HiOutlineMoon, HiOutlineUserGroup, HiOutlineMail, HiOutlineArrowUp } from 'react-icons/hi';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';
import { useTheme } from '../context/ThemeContext';
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
        role: 'Design & Frontend Development'
    },
    {
        name: 'Rudra Babar',
        role: 'Backend & AI Integration'
    }
];

function FaqAccordionItem({ faq, isOpen, onClick }) {
    return (
        <div className="rounded-3xl border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:shadow-lg hover:bg-white/90 dark:hover:bg-black/80">
            <button
                type="button"
                onClick={onClick}
                className="w-full flex items-center justify-between gap-4 p-6 text-left"
            >
                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {faq.question}
                </span>
                <span
                    className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 dark:bg-white/10 border border-purple-100 dark:border-white/10 text-xl text-indigo-600 dark:text-white transition-transform duration-300 ${isOpen ? 'rotate-45' : ''
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
                    <div className="px-6 pb-6">
                        <div className="border-t border-purple-100 dark:border-white/10 pt-6 text-slate-600 dark:text-white/70 leading-relaxed">
                            {faq.answer}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExpandableDarkPanel({ children }) {
    const containerRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsExpanded(true);
                } else if (entry.boundingClientRect.top > 0) {
                    setIsExpanded(false);
                }
            },
            {
                threshold: 0.2,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        const currentRef = containerRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full relative mt-12 mb-24 flex justify-center">
            <div
                className="bg-slate-950 dark:bg-black rounded-[2.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden border border-slate-800 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                    width: isExpanded ? 'calc(100vw - 2.5rem)' : '100%',
                    marginLeft: isExpanded ? 'calc(-50vw + 50% + 1.25rem)' : '0px',
                    marginRight: isExpanded ? 'calc(-50vw + 50% + 1.25rem)' : '0px',
                    maxWidth: isExpanded ? '100vw' : '100%'
                }}
            >
                <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function Landing() {
    const { theme, toggleTheme } = useTheme();
    const logoIcon = theme === 'dark' ? newDarkLogo : newLightLogo;

    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All Questions');
    const [searchTerm, setSearchTerm] = useState('');

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const filteredFaqs = faqData.filter((faq) => {
        const matchesCategory = activeCategory === 'All Questions' || faq.category === activeCategory;
        const matchesSearch =
            searchTerm.trim() === '' ||
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-surface flex flex-col text-text overflow-hidden relative transition-colors duration-300">
            {/* Background Halo Arch for Light Mode */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] max-w-[1600px] h-[650px] bg-gradient-to-b from-white/90 via-purple-200/30 to-transparent rounded-b-[100%] blur-3xl pointer-events-none opacity-100 dark:opacity-0 z-0" />

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-surface border-b border-purple-100 dark:border-black/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center">
                                <img src={logoIcon} alt="PricePilot Logo" className="w-full h-full object-contain drop-shadow-sm" />
                            </div>
                            <span className="font-extrabold text-2xl tracking-tight text-text relative z-10">PricePilot AI</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            <Link to="/docs" className="text-text-muted hover:text-primary transition-colors text-sm font-medium">
                                Docs
                            </Link>

                            <a href="#faq" className="text-text-muted hover:text-primary transition-colors text-sm font-medium">
                                FAQ
                            </a>

                            <a href="#about" className="text-text-muted hover:text-primary transition-colors text-sm font-medium">
                                About Us
                            </a>

                            <Link to="/login" className="text-text-muted hover:text-primary transition-colors text-sm font-medium">
                                Sign In
                            </Link>

                            {/* Theme Toggle Button */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-full text-text-muted hover:text-primary hover:bg-purple-100/50 dark:hover:bg-surface/50 transition-colors border border-purple-200 dark:border-transparent"
                                title="Toggle Theme"
                            >
                                {theme === "dark" ? (
                                    <HiOutlineSun className="w-5 h-5" />
                                ) : (
                                    <HiOutlineMoon className="w-5 h-5" />
                                )}
                            </button>

                            {/* See Demo Button */}
                            <Link
                                to="/demo"
                                className="btn-primary py-2.5 px-6 rounded-full text-sm shadow-md"
                            >
                                See Demo
                            </Link>

                            {/* Get Started Button */}
                            <Link
                                to="/register"
                                className="btn-primary py-2.5 px-6 rounded-full text-sm shadow-md"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col px-4 pt-36 pb-20 relative z-10 w-full max-w-[1400px] mx-auto">

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center mb-24">
                    {/* Left Column: Text & CTA */}
                    <div className="text-center lg:text-left flex flex-col items-center lg:items-start animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 dark:bg-surface-light border border-indigo-200 dark:border-black/10 text-indigo-600 dark:text-primary font-semibold mb-8 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 dark:bg-primary-light opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-primary"></span>
                            </span>
                            PricePilot AI 1.0 is Live
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-text mb-6">
                            Dynamic Pricing<br />
                            Powered by <br className="hidden md:block" />
                            <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-400 bg-clip-text text-transparent font-extrabold">Generative AI</span>
                        </h1>

                        <p className="text-xl text-slate-600 dark:text-text-muted mb-10 max-w-lg leading-relaxed">
                            Manage inventory, forecast demand, and improve profitability with intelligent insights designed for modern businesses.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/register" className="btn-primary text-lg px-8 py-3.5 rounded-full shadow-[0_8px_25px_rgba(84,82,246,0.35)]">
                                Start Optimizing Now
                            </Link>
                            <Link to="/demo" className="btn-secondary text-lg px-8 py-3.5 rounded-full flex items-center justify-center gap-2 border border-purple-200 dark:border-black/10 bg-white/80 dark:bg-transparent hover:bg-purple-50 dark:hover:bg-black/5">
                                See Demo <span className="text-sm">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Hero Dashboard */}
                    <div className="w-full flex justify-center lg:justify-end animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <HeroDashboard />
                    </div>
                </div>

                {/* Dark Panel */}
                <ExpandableDarkPanel>
                    {/* Left: Illustrative Diagram */}
                    <div className="flex-1 w-full relative min-h-[300px] md:min-h-[400px] flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full max-w-sm h-full font-sans">
                                {/* Center Node */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 bg-black p-5 rounded-2xl shadow-xl border border-white/10">
                                    <p className="text-white/60 text-sm mb-1 font-medium">How does</p>
                                    <p className="text-white text-2xl font-bold tracking-wide">AI work?</p>
                                </div>

                                {/* Connecting lines */}
                                <svg className="absolute inset-0 w-full h-full text-white/10" stroke="currentColor" strokeWidth={1.5}>
                                    <line x1="50%" y1="50%" x2="20%" y2="20%" />
                                    <line x1="50%" y1="50%" x2="80%" y2="20%" />
                                    <line x1="50%" y1="50%" x2="90%" y2="35%" />
                                    <line x1="50%" y1="50%" x2="90%" y2="50%" />
                                    <line x1="50%" y1="50%" x2="80%" y2="80%" />
                                    <line x1="50%" y1="50%" x2="50%" y2="90%" />
                                    <line x1="50%" y1="50%" x2="20%" y2="80%" />
                                    <line x1="50%" y1="50%" x2="10%" y2="50%" />
                                    <line x1="50%" y1="50%" x2="40%" y2="10%" />
                                </svg>

                                {/* Node labels */}
                                <div className="absolute top-[15%] left-[15%] -translate-x-1/2 -translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Processing</div>
                                <div className="absolute top-[15%] right-[15%] translate-x-1/2 -translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Analysis</div>
                                <div className="absolute top-[50%] right-[5%] translate-x-1/2 -translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Input</div>
                                <div className="absolute bottom-[15%] right-[15%] translate-x-1/2 translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Output</div>
                                <div className="absolute bottom-[5%] left-[50%] -translate-x-1/2 translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Collection</div>
                                <div className="absolute bottom-[15%] left-[15%] -translate-x-1/2 translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Optimize</div>
                                <div className="absolute top-[50%] left-[5%] -translate-x-1/2 -translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Learning</div>
                                <div className="absolute top-[5%] left-[40%] -translate-x-1/2 -translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Prediction</div>
                                <div className="absolute top-[35%] right-[10%] translate-x-1/2 -translate-y-1/2 bg-[#2A2A2A] px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 shadow-md border border-white/5 hover:bg-[#333333] hover:scale-105 transition-all">Training</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Text and CTA */}
                    <div className="flex-1 text-center md:text-left flex flex-col justify-center items-center md:items-start pl-0 md:pl-8">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Built for <span className="italic text-gray-300">businesses.</span><br />
                            Powered by <span className="italic text-gray-300">AI.</span>
                        </h2>
                        <p className="text-white/70 text-lg mb-8 max-w-md">
                            Manage inventory, forecast demand, and improve profitability with intelligent insights designed for modern businesses.
                        </p>
                        <div className="flex gap-4">
                            <div className="relative group inline-block">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 via-yellow-400 to-blue-500 rounded-full blur-sm opacity-80 group-hover:opacity-100 transition duration-500"></div>
                                <Link to="/demo" className="relative bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                                    See Demo <span className="text-sm">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </ExpandableDarkPanel>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl w-full mt-24 animate-slide-up relative z-10 mx-auto" style={{ animationDelay: '0.3s' }}>
                    {/* Card 1 */}
                    <div className="rounded-[2rem] border border-purple-100 dark:border-blue-900/40 bg-white dark:bg-[#0B1528] p-8 flex flex-col transition-all duration-300 hover:border-indigo-300 dark:hover:border-blue-500/50 shadow-[0_10px_30px_rgba(147,51,234,0.06)] hover:shadow-[0_15px_40px_rgba(147,51,234,0.12)]">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 text-xl">
                            <HiOutlineLightningBolt className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Introducing Real-Time Algorithms</h3>
                        <p className="text-slate-600 dark:text-blue-100/70 leading-relaxed mb-6">
                            Binary-search margin optimization paired with dynamic elasticity models to find the perfect price instantly.
                        </p>
                        <a href="#" className="text-sm font-semibold text-indigo-600 dark:text-blue-400 hover:opacity-80 transition-opacity mb-6 inline-flex items-center gap-1">
                            Feature details <span>→</span>
                        </a>

                        <div className="mt-auto">
                            <div className="flex items-center justify-between border-t border-purple-100 dark:border-blue-900/40 pt-4 mb-6">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-blue-400/70">Category</span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-blue-200">Pricing & AI</span>
                            </div>
                            <button className="w-full bg-indigo-600 dark:bg-blue-600 text-white rounded-full py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-blue-700 transition-colors shadow-md shadow-indigo-500/20">
                                Read announcement <span>→</span>
                            </button>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="rounded-[2rem] border border-purple-100 dark:border-purple-900/40 bg-white dark:bg-[#170C28] p-8 flex flex-col transition-all duration-300 hover:border-indigo-300 dark:hover:border-purple-500/50 shadow-[0_10px_30px_rgba(147,51,234,0.06)] hover:shadow-[0_15px_40px_rgba(147,51,234,0.12)]">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-purple-950/80 text-indigo-600 dark:text-purple-400 flex items-center justify-center mb-6 text-xl">
                            <HiOutlineCubeTransparent className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Introducing Multi-Signal Demand</h3>
                        <p className="text-slate-600 dark:text-purple-100/70 leading-relaxed mb-6">
                            Forecast inventory leveraging social sentiment, weather events, and search trends across the web.
                        </p>
                        <a href="#" className="text-sm font-semibold text-indigo-600 dark:text-purple-400 hover:opacity-80 transition-opacity mb-6 inline-flex items-center gap-1">
                            Feature details <span>→</span>
                        </a>

                        <div className="mt-auto">
                            <div className="flex items-center justify-between border-t border-purple-100 dark:border-purple-900/40 pt-4 mb-6">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-purple-400/70">Category</span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-purple-200">Forecasting</span>
                            </div>
                            <button className="w-full bg-indigo-600 dark:bg-purple-600 text-white rounded-full py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-purple-700 transition-colors shadow-md shadow-indigo-500/20">
                                Read announcement <span>→</span>
                            </button>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="rounded-[2rem] border border-purple-100 dark:border-emerald-900/40 bg-white dark:bg-[#071C12] p-8 flex flex-col transition-all duration-300 hover:border-indigo-300 dark:hover:border-emerald-500/50 shadow-[0_10px_30px_rgba(147,51,234,0.06)] hover:shadow-[0_15px_40px_rgba(147,51,234,0.12)]">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-emerald-950/80 text-indigo-600 dark:text-emerald-400 flex items-center justify-center mb-6 text-xl">
                            <HiOutlineShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Announcing Explainable AI</h3>
                        <p className="text-slate-600 dark:text-emerald-100/70 leading-relaxed mb-6">
                            Never guess why a price changed. Our Gemini-powered XAI dashboard gives you total transparency.
                        </p>
                        <a href="#" className="text-sm font-semibold text-indigo-600 dark:text-emerald-400 hover:opacity-80 transition-opacity mb-6 inline-flex items-center gap-1">
                            Feature details <span>→</span>
                        </a>

                        <div className="mt-auto">
                            <div className="flex items-center justify-between border-t border-purple-100 dark:border-emerald-900/40 pt-4 mb-6">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-emerald-400/70">Category</span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-emerald-200">Insights</span>
                            </div>
                            <button className="w-full bg-indigo-600 dark:bg-emerald-600 text-white rounded-full py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-emerald-700 transition-colors shadow-md shadow-indigo-500/20">
                                Read announcement <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mission statement + resource list */}
                <div className="w-full max-w-7xl mx-auto mt-24 text-left grid md:grid-cols-2 gap-12 md:gap-24 border-t border-purple-100 dark:border-border pt-16">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-extrabold leading-snug text-slate-900 dark:text-text">
                            At PricePilot AI, we build<br />
                            AI to serve your business's<br />
                            long-term profitability.
                        </h3>
                    </div>
                    <div className="flex flex-col gap-0">
                        {[
                            { title: 'Core views on AI safety', category: 'Announcements' },
                            { title: "PricePilot's Responsible Scaling Policy", category: 'Alignment Science' },
                            { title: 'PricePilot Academy: Build and Learn', category: 'Education' },
                            { title: "PricePilot's Economic Index", category: 'Economic Research' },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center border-b border-purple-100 dark:border-border py-5 group cursor-pointer"
                            >
                                <span className="text-sm font-semibold text-slate-900 dark:text-text group-hover:text-indigo-600 dark:group-hover:text-primary transition-colors">{item.title}</span>
                                <span className="text-sm text-slate-500 dark:text-text-muted">{item.category}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <section id="faq" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[360px_1fr] items-start">
                        <div className="rounded-[2rem] border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-8 shadow-xl transition-colors duration-300">
                            <span className="inline-flex items-center rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-6">
                                FAQ Navigation
                            </span>

                            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Got Questions?</h2>
                            <p className="text-slate-600 dark:text-white/70 leading-relaxed mb-8">
                                Everything you need to know about our dynamic price optimization engine, real-time tracking, and security seals.
                            </p>

                            <div className="mb-8">
                                <label htmlFor="faq-search" className="sr-only">Search FAQ</label>
                                <div className="relative">
                                    <input
                                        id="faq-search"
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search for answers..."
                                        className="w-full rounded-3xl border border-purple-200 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 px-5 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    {searchTerm ? (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm"
                                        >
                                            Clear
                                        </button>
                                    ) : (
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40">⌘K</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {faqCategories.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveCategory(item)}
                                        className={`w-full rounded-3xl px-5 py-4 text-left text-base font-medium transition ${activeCategory === item
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-transparent text-slate-600 dark:text-white/70 hover:bg-purple-50 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
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
                                <div className="rounded-3xl border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-10 text-center text-slate-500 dark:text-white/60">
                                    No questions match your search. Try a different keyword or category.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* About Us Section */}
                <section id="about" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-10">
                            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">About Us</h2>
                        </div>

                        <div className="rounded-[2rem] border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-xl p-8 md:p-12 text-center space-y-6 shadow-xl">
                            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-tr from-indigo-100 via-purple-50 to-blue-100 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 border border-indigo-200 dark:border-white/10 p-4 shadow-inner flex items-center justify-center relative overflow-hidden mb-8">
                                <img src={logoIcon} alt="PricePilot AI Logo" className="w-full h-full object-contain drop-shadow-md" />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">PricePilot AI Team</h3>

                            <p className="text-slate-600 dark:text-white/70 max-w-2xl mx-auto leading-relaxed">
                                We are a passionate team of developers and AI enthusiasts building the future of e-commerce.
                                PricePilot AI was developed as a comprehensive Final Year Project to demonstrate the real-world utility of Generative AI, machine learning forecasting, and dynamic pricing algorithms.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 mt-10 text-left">
                                <div className="bg-purple-50/50 dark:bg-white/5 text-slate-900 dark:text-white p-6 rounded-2xl border border-purple-100 dark:border-white/10">
                                    <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Our Mission</h4>
                                    <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">To democratize enterprise-grade pricing intelligence, making it accessible, transparent, and fully explainable for merchants of all sizes.</p>
                                </div>
                                <div className="bg-purple-50/50 dark:bg-white/5 text-slate-900 dark:text-white p-6 rounded-2xl border border-purple-100 dark:border-white/10">
                                    <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">The Tech</h4>
                                    <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">Powered by React, Node.js, FastAPI, and Google Gemini, we bridge the gap between deterministic algorithms and generative insights.</p>
                                </div>
                            </div>

                            {/* Team Members */}
                            <div className="mt-14 text-left">
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Meet the Team</h4>
                                <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.name}
                                            className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-purple-100 dark:border-white/10 text-center hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all shadow-sm"
                                        >
                                            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white mb-4 shadow-md">
                                                {member.name.split(' ').map((n) => n[0]).join('')}
                                            </div>
                                            <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-white/60">{member.role}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="mt-14 pt-10 border-t border-purple-100 dark:border-white/10 text-left">
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Get in Touch</h4>

                                {/* GitHub Repo Button */}
                                <div className="flex justify-center mb-8">
                                    <a
                                        href="https://github.com/rb-369/Price-Pilot-Ai"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-purple-200 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-purple-100/50 dark:hover:bg-white/10 transition-all shadow-sm group"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-surface-dark flex items-center justify-center shadow-sm">
                                            <FaGithub className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">View on GitHub</p>
                                            <p className="text-xs text-slate-500 dark:text-white/60">rb-369/Price-Pilot-Ai</p>
                                        </div>
                                    </a>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <a
                                        href="mailto:pricepilot5@gmail.com"
                                        className="inline-flex items-center gap-2 text-slate-600 dark:text-white/80 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <HiOutlineMail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        pricepilot5@gmail.com
                                    </a>

                                    <a
                                        href="https://www.linkedin.com/in/aryan-desale-18330a377"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-slate-600 dark:text-white/80 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <FaLinkedin className="w-5 h-5 text-[#0A66C2]" />
                                        Aryan Desale
                                    </a>

                                    <a
                                        href="http://www.linkedin.com/in/rudra-babar-8594a8379"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-slate-600 dark:text-white/80 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <FaLinkedin className="w-5 h-5 text-[#0A66C2]" />
                                        Rudra Babar
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Back to Top Button */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-20 right-8 z-50 animate-float px-5 py-3 rounded-full bg-white dark:bg-surface-light border border-purple-200 dark:border-black/10 shadow-[0_8px_25px_rgba(147,51,234,0.12)] flex items-center gap-2 text-slate-900 dark:text-text font-semibold hover:border-indigo-400 transition-all"
                >
                    <HiOutlineArrowUp className="w-4 h-4 text-indigo-600 dark:text-primary" />
                    Back to Top
                </button>

            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full bg-slate-900 dark:bg-surface py-16 mt-12 text-text-muted">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="font-bold text-2xl tracking-tight text-white">PricePilot AI</span>
                        </div>
                        <p className="text-white/60 text-sm max-w-xs leading-relaxed mb-6">
                            Empowering modern businesses with generative AI, machine learning forecasting, and dynamic pricing algorithms.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Products</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li><Link to="/demo" className="hover:text-white transition-colors">See Demo</Link></li>
                            <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                            <li><a href="https://github.com/rb-369/Price-Pilot-Ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
                    <p>&copy; {new Date().getFullYear()} PricePilot AI. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <a href="https://www.linkedin.com/in/aryan-desale-18330a377" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            <FaLinkedin className="w-4 h-4" />
                        </a>
                        <a href="https://github.com/rb-369/Price-Pilot-Ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            <FaGithub className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}