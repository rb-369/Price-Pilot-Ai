import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineChartBar, HiOutlineCubeTransparent, HiOutlineTrendingUp, HiOutlineShieldCheck, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import landingBgDark from '../assets/BG_dark2.png';
import landingBgLight from '../assets/BG_light2.png';
import logoIcon from '../assets/FINAL.png';
import { useTheme } from '../context/ThemeContext';

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

function FaqAccordionItem({ faq, isOpen, onClick }) {
    return (
        <div
            className="rounded-[1.75rem] border border-primary/10 bg-surface/70 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
        >
            <button
                type="button"
                onClick={onClick}
                className="w-full flex items-center justify-between gap-4 p-6 text-left"
            >
                <span className="text-lg font-semibold text-text">
                    {faq.question}
                </span>
                <span
                    className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-primary/10 text-xl text-primary transition-transform duration-300 ${
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
                    <div className="px-6 pb-6">
                        <div className="border-t border-primary/10 pt-6 text-text-muted leading-relaxed">
                            {faq.answer}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Landing() {
    const { theme, toggleTheme } = useTheme();
    const landingBg = theme === 'light' ? landingBgLight : landingBgDark;
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
        <div
            className="min-h-screen bg-surface flex flex-col text-text overflow-hidden relative transition-colors duration-300"
            style={{
                backgroundImage: `url("${landingBg}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Adaptive Overlay */}
            <div className="absolute inset-0 bg-surface/30 backdrop-blur-[2px] z-0 pointer-events-none"></div>

            {/* Navbar - Transparent */}
            <nav className="fixed w-full z-50 bg-transparent border-b border-primary/10 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center relative">
                                <img src={logoIcon} alt="PricePilot Logo" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-1.5 w-[280%] h-[280%] max-w-none object-contain drop-shadow-md pointer-events-none" />
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-text relative z-10">PricePilot AI</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            <Link to="/docs" className="text-text-muted hover:text-text transition-colors text-sm font-medium">
                                Docs
                            </Link>

                            <a href="#faq" className="text-text-muted hover:text-text transition-colors text-sm font-medium">
                                FAQ
                            </a>

                            <Link to="/about" className="text-text-muted hover:text-text transition-colors text-sm font-medium">
                                About Us
                            </Link>

                            <Link to="/login" className="text-text-muted hover:text-text transition-colors text-sm font-medium">
                                Sign In
                            </Link>

                            {/* Theme Toggle Button */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface/50 transition-colors border border-transparent hover:border-primary/10 backdrop-blur-sm"
                                title="Toggle Theme"
                            >
                                {theme === "dark" ? (
                                    <HiOutlineSun className="w-5 h-5" />
                                ) : (
                                    <HiOutlineMoon className="w-5 h-5" />
                                )}
                            </button>

                            {/* Try Demo Button */}
                            <Link
                                to="/demo"
                                className="btn-primary py-2.5 px-6 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                            >
                                See Demo
                            </Link>

                            {/* Get Started Button */}
                            <Link
                                to="/register"
                                className="btn-primary py-2.5 px-6 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-36 pb-20 relative z-10 w-full max-w-[1400px] mx-auto">

                {/* Floating Decorative Elements */}
                <div className="hidden lg:block absolute left-4 top-1/3 animate-float glass-card p-4 rounded-2xl bg-surface/60 backdrop-blur-md border border-primary/10 shadow-2xl opacity-90" style={{ animationDelay: '0s' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <HiOutlineTrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-text-muted font-medium">Profit Margin</p>
                            <p className="text-lg font-bold text-text">+24.5%</p>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block absolute right-4 top-1/4 animate-float glass-card p-4 rounded-2xl bg-surface/60 backdrop-blur-md border border-primary/10 shadow-2xl opacity-90" style={{ animationDelay: '2s' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <HiOutlineShieldCheck className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-text-muted font-medium">AI Accuracy</p>
                            <p className="text-lg font-bold text-text">99.8%</p>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block absolute left-12 bottom-[32%] animate-float glass-card p-4 rounded-2xl bg-surface/60 backdrop-blur-md border border-primary/10 shadow-2xl opacity-90" style={{ animationDelay: '4s' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <HiOutlineCubeTransparent className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-text-muted font-medium">Competitors Tracked</p>
                            <p className="text-lg font-bold text-text">1,204</p>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block absolute right-12 bottom-[38%] animate-float glass-card p-4 rounded-2xl bg-surface/60 backdrop-blur-md border border-primary/10 shadow-2xl opacity-90" style={{ animationDelay: '1.5s' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <HiOutlineLightningBolt className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-text-muted font-medium">Dynamic Updates</p>
                            <p className="text-lg font-bold text-text">Real-Time</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface/80 backdrop-blur-md border border-primary/20 text-primary font-semibold mb-8 animate-fade-in shadow-lg">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    PricePilot AI 1.0 is Live
                </div>

                <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 animate-slide-up max-w-5xl text-text">
                    Dynamic Pricing Powered by <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500">Generative AI</span>
                </h1>

                <p className="text-xl md:text-2xl text-text-muted mb-12 max-w-3xl animate-slide-up bg-surface/50 backdrop-blur-md p-6 rounded-3xl border border-primary/10 shadow-xl leading-relaxed" style={{ animationDelay: '0.1s' }}>
                    Automate your e-commerce pricing strategy with real-time competitor tracking, demand forecasting, and fully explainable LLM-driven insights.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <Link to="/register" className="btn-primary text-xl px-10 py-4 shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:scale-105 transition-transform">
                        Start Optimizing Now
                    </Link>
                    <Link to="/docs" className="btn-secondary text-xl px-10 py-4 bg-surface/60 backdrop-blur-md hover:bg-surface hover:scale-105 transition-transform">
                        Read Documentation
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl w-full mt-32 animate-slide-up relative z-10" style={{ animationDelay: '0.3s' }}>
                    <div className="glass-card p-10 text-left hover:border-indigo-500/50 transition-all group backdrop-blur-xl bg-surface/60 hover:-translate-y-2 duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                            <HiOutlineLightningBolt className="w-7 h-7 text-indigo-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-text mb-4">Real-Time Algorithms</h3>
                        <p className="text-text-muted text-lg leading-relaxed">Binary-search margin optimization paired with dynamic elasticity models to find the perfect price instantly.</p>
                    </div>

                    <div className="glass-card p-10 text-left hover:border-cyan-500/50 transition-all group backdrop-blur-xl bg-surface/60 hover:-translate-y-2 duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                            <HiOutlineCubeTransparent className="w-7 h-7 text-cyan-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-text mb-4">Multi-Signal Demand</h3>
                        <p className="text-text-muted text-lg leading-relaxed">Forecast inventory leveraging social sentiment, weather events, and search trends across the web.</p>
                    </div>

                    <div className="glass-card p-10 text-left hover:border-purple-500/50 transition-all group backdrop-blur-xl bg-surface/60 hover:-translate-y-2 duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                            <HiOutlineChartBar className="w-7 h-7 text-purple-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-text mb-4">Explainable AI</h3>
                        <p className="text-text-muted text-lg leading-relaxed">Never guess why a price changed. Our Gemini-powered XAI dashboard gives you total transparency.</p>
                    </div>
                </div>

                {/* FAQ Section */}
                <section id="faq" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[360px_1fr] items-start">
                        <div className="rounded-[2rem] border border-primary/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl shadow-primary/5">
                            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-6">
                                FAQ Navigation
                            </span>

                            <h2 className="text-4xl font-bold text-text mb-4">Got Questions?</h2>
                            <p className="text-text-muted leading-relaxed mb-8">
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
                                        className="w-full rounded-3xl border border-primary/10 bg-surface/90 px-5 py-3 text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    {searchTerm ? (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-sm"
                                        >
                                            Clear
                                        </button>
                                    ) : (
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">⌘K</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {faqCategories.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveCategory(item)}
                                        className={`w-full rounded-3xl px-5 py-4 text-left text-base font-medium transition ${
                                            activeCategory === item
                                                ? 'bg-primary/10 text-primary shadow-sm shadow-primary/10'
                                                : 'bg-surface/70 text-text-muted hover:bg-surface/90'
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
                                <div className="rounded-[1.75rem] border border-primary/10 bg-surface/70 p-10 text-center text-text-muted">
                                    No questions match your search. Try a different keyword or category.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full border-t border-primary/10 bg-surface/30 backdrop-blur-md py-6 mt-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
                    <p>&copy; {new Date().getFullYear()} PricePilot AI. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link to="/privacy" className="hover:text-text transition-colors">Privacy Policy</Link>
                        <Link to="/about" className="hover:text-text transition-colors">About Us</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}