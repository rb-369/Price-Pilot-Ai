import { Link } from 'react-router-dom';
import { HiOutlineUserGroup, HiOutlineArrowLeft } from 'react-icons/hi';

export default function About() {
    return (
        <div className="min-h-screen bg-surface flex flex-col text-text overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-12 w-full">
                <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
                    <HiOutlineArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <HiOutlineUserGroup className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-bold">About Us</h1>
                </div>

                <div className="glass-card p-8 text-center space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] mb-6">
                        <span className="text-4xl">🚀</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">PricePilot AI Team</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        We are a passionate team of developers and AI enthusiasts building the future of e-commerce. 
                        PricePilot AI was developed as a comprehensive Final Year Project to demonstrate the real-world utility of Generative AI, machine learning forecasting, and dynamic pricing algorithms.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mt-12 text-left">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                            <h3 className="font-semibold text-indigo-300 mb-2">Our Mission</h3>
                            <p className="text-sm text-slate-400">To democratize enterprise-grade pricing intelligence, making it accessible, transparent, and fully explainable for merchants of all sizes.</p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                            <h3 className="font-semibold text-cyan-300 mb-2">The Tech</h3>
                            <p className="text-sm text-slate-400">Powered by React, Node.js, FastAPI, and Google Gemini, we bridge the gap between deterministic algorithms and generative insights.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
