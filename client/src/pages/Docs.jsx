import { Link } from 'react-router-dom';
import { HiOutlineDocumentText, HiOutlineArrowLeft } from 'react-icons/hi';

export default function Docs() {
    return (
        <div className="min-h-screen bg-surface flex flex-col text-text overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-12 w-full">
                <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
                    <HiOutlineArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <HiOutlineDocumentText className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold">Documentation</h1>
                </div>

                <div className="glass-card p-8 prose prose-invert max-w-none">
                    <h2 className="text-2xl font-semibold text-white mb-4">Welcome to PricePilot AI</h2>
                    <p className="text-slate-300 leading-relaxed mb-6">
                        PricePilot AI is an advanced, AI-driven e-commerce dynamic pricing and inventory management system. 
                        It uses a multi-tier microservices architecture to evaluate competitive landscapes, internal margins, and external demand signals to optimize your product pricing in real-time.
                    </p>

                    <h3 className="text-xl font-semibold text-white mt-8 mb-4">Core Concepts</h3>
                    <ul className="list-disc pl-6 text-slate-300 space-y-3">
                        <li><strong>Dynamic Margin Optimization:</strong> A binary-search algorithm that balances unit economics against predicted demand elasticity.</li>
                        <li><strong>Competitor Intelligence:</strong> Integration with external APIs (like Rainforest API) to scrape Amazon prices dynamically.</li>
                        <li><strong>Explainable AI (XAI):</strong> Transparent decision mapping powered by Google Gemini, giving you the "why" behind every price change.</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mt-8 mb-4">Getting Started</h3>
                    <p className="text-slate-300 leading-relaxed mb-4">
                        To begin using the platform, create an account, register your products with their base costs and target margins, and let the AI models start collecting demand signals.
                    </p>
                </div>
            </div>
        </div>
    );
}
