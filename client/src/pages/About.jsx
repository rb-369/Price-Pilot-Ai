import { Link } from 'react-router-dom';
import { HiOutlineUserGroup, HiOutlineArrowLeft, HiOutlineLightningBolt } from 'react-icons/hi';
import { FaGithub } from 'react-icons/fa';

export default function About() {
    return (
        <div className="min-h-screen bg-[#F0EEE6] dark:bg-[#211610] flex flex-col text-text overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-12 w-full">
                <Link to="/" className="inline-flex items-center text-primary hover:text-primary-hover mb-8 transition-colors font-medium text-sm">
                    <HiOutlineArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <HiOutlineUserGroup className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-text">About Us</h1>
                </div>

                <div className="glass-card p-8 text-center space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-primary to-copper flex items-center justify-center shadow-[0_0_30px_rgba(168,90,60,0.3)] mb-6">
                        <HiOutlineLightningBolt className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-text">PricePilot AI Team</h2>
                    <p className="text-text-muted max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
                        We are a passionate team of developers and AI enthusiasts building the future of e-commerce. 
                        PricePilot AI was developed as a comprehensive Final Year Project to demonstrate the real-world utility of Generative AI, machine learning forecasting, and dynamic pricing algorithms.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mt-12 text-left">
                        <div className="bg-surface-light p-6 rounded-xl border border-border">
                            <h3 className="font-semibold text-primary mb-2">Our Mission</h3>
                            <p className="text-sm text-text-muted">To democratize enterprise-grade pricing intelligence, making it accessible, transparent, and fully explainable for merchants of all sizes.</p>
                        </div>
                        <div className="bg-surface-light p-6 rounded-xl border border-border">
                            <h3 className="font-semibold text-copper mb-2">The Tech</h3>
                            <p className="text-sm text-text-muted">Powered by React, Node.js, FastAPI, and Google Gemini, we bridge the gap between deterministic algorithms and generative insights.</p>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-border">
                        <a
                            href="https://github.com/rb-369/Price-Pilot-Ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-surface-light border border-border hover:border-primary/50 hover:bg-surface-lighter transition-all duration-300 group shadow-sm"
                        >
                            <FaGithub className="w-6 h-6 text-text group-hover:text-primary transition-colors" />
                            <div className="text-left">
                                <div className="text-sm font-semibold text-text group-hover:text-primary transition-colors">View on GitHub</div>
                                <div className="text-xs text-text-muted">rb-369/Price-Pilot-Ai</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
