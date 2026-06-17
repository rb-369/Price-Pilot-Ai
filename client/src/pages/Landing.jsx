import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineChartBar, HiOutlineSparkles, HiOutlineCubeTransparent } from 'react-icons/hi';

export default function Landing() {
    return (
        <div className="min-h-screen bg-surface flex flex-col text-text overflow-hidden relative">
            {/* Background Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-surface/80 backdrop-blur-md border-b border-primary/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                <HiOutlineSparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-text">PricePilot AI</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link to="/docs" className="text-text-muted hover:text-text transition-colors text-sm font-medium">Docs</Link>
                            <Link to="/about" className="text-text-muted hover:text-text transition-colors text-sm font-medium">About Us</Link>
                            <Link to="/login" className="text-text-muted hover:text-text transition-colors text-sm font-medium">Sign In</Link>
                            <Link to="/register" className="btn-primary py-2 px-4 shadow-[0_0_15px_rgba(99,102,241,0.4)]">Get Started</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8 animate-fade-in">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    PricePilot AI 2.0 is Live
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up max-w-4xl text-text">
                    Dynamic Pricing Powered by <br className="hidden md:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500">Generative AI</span>
                </h1>
                
                <p className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    Automate your e-commerce pricing strategy with real-time competitor tracking, demand forecasting, and fully explainable LLM-driven insights.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <Link to="/register" className="btn-primary text-lg px-8 py-3 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                        Start Optimizing Now
                    </Link>
                    <Link to="/docs" className="btn-secondary text-lg px-8 py-3">
                        Read Documentation
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl w-full mt-24 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="glass-card p-8 text-left hover:border-indigo-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <HiOutlineLightningBolt className="w-6 h-6 text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold text-text mb-3">Real-Time Algorithms</h3>
                        <p className="text-text-muted">Binary-search margin optimization paired with dynamic elasticity models to find the perfect price instantly.</p>
                    </div>
                    
                    <div className="glass-card p-8 text-left hover:border-cyan-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <HiOutlineCubeTransparent className="w-6 h-6 text-cyan-500" />
                        </div>
                        <h3 className="text-xl font-bold text-text mb-3">Multi-Signal Demand</h3>
                        <p className="text-text-muted">Forecast inventory leveraging social sentiment, weather events, and search trends across the web.</p>
                    </div>

                    <div className="glass-card p-8 text-left hover:border-purple-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <HiOutlineChartBar className="w-6 h-6 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold text-text mb-3">Explainable AI</h3>
                        <p className="text-text-muted">Never guess why a price changed. Our Gemini-powered XAI dashboard gives you total transparency.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
