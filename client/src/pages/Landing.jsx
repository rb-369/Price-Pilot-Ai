import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineChartBar, HiOutlineCubeTransparent, HiOutlineTrendingUp, HiOutlineShieldCheck, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import landingBgDark from '../assets/BG_dark2.png';
import landingBgLight from '../assets/BG_light2.png';
import logoIcon from '../assets/FINAL.png';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
    const { theme, toggleTheme } = useTheme();
    const landingBg = theme === 'light' ? landingBgLight : landingBgDark;

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

