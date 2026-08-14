import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineSun, HiOutlineMoon, HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineScale, HiOutlineLockClosed } from 'react-icons/hi';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';

export default function TermsOfService() {
    const { theme, toggleTheme } = useTheme();
    const logoIcon = theme === 'dark' ? newDarkLogo : newLightLogo;

    return (
        <div className="min-h-screen bg-surface flex flex-col text-text transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border/40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <img src={logoIcon} alt="PricePilot AI Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-text">PricePilot AI</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface-lighter transition-colors border border-border/40"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <HiOutlineSun className="w-5 h-5 text-amber-400" /> : <HiOutlineMoon className="w-5 h-5 text-primary" />}
                        </button>
                        <Link to="/" className="text-xs font-semibold text-text-muted hover:text-text bg-surface-light px-3.5 py-2 rounded-xl border border-border/80 transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                        <HiOutlineDocumentText className="w-4 h-4" />
                        Legal Agreement
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-text tracking-tight mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-sm text-text-muted">
                        Last Updated: August 14, 2026 • Effective Immediately
                    </p>
                </div>

                <div className="glass-card p-8 sm:p-12 rounded-3xl border border-border/60 space-y-10 animate-slide-up text-sm sm:text-base leading-relaxed">
                    {/* Section 1 */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2.5 text-primary font-bold text-lg">
                            <HiOutlineShieldCheck className="w-5 h-5" />
                            <h2>1. Acceptance of Terms</h2>
                        </div>
                        <p className="text-text-muted">
                            By accessing or using PricePilot AI ("Service", "Platform", or "We"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not access or use the platform. These terms govern all access to our dynamic pricing models, demand forecasting tools, API integrations, and explainable AI insights.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2.5 text-primary font-bold text-lg">
                            <HiOutlineScale className="w-5 h-5" />
                            <h2>2. Service Description & AI Pricing Disclaimers</h2>
                        </div>
                        <p className="text-text-muted">
                            PricePilot AI provides automated pricing optimization, competitor intelligence scraping, and machine learning elasticity forecasts. While our algorithms and Google Gemini XAI models strive to recommend mathematically optimal prices, merchants retain final authority and responsibility over all price changes published to live storefronts (including Shopify, Amazon, and Flipkart).
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-text-muted pl-2 text-sm">
                            <li>Recommendations are probabilistic forecasts based on historical demand signals and competitor market samples.</li>
                            <li>PricePilot AI provides configurable safety guardrails (Margin Floors and Surge Ceilings) to protect user profitability.</li>
                            <li>We are not liable for lost profits, platform policy violations on external marketplaces, or unintentional price overrides caused by third-party API disruptions.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2.5 text-primary font-bold text-lg">
                            <HiOutlineLockClosed className="w-5 h-5" />
                            <h2>3. Proprietary Data & Confidentiality</h2>
                        </div>
                        <p className="text-text-muted">
                            Your product catalog, cost of goods sold (COGS), internal inventory figures, and sales velocity data remain your sole property. PricePilot AI will never share, sell, or disclose your confidential merchant data to competing stores or third parties.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="space-y-3">
                        <h2 className="text-primary font-bold text-lg">4. User Account & API Keys</h2>
                        <p className="text-text-muted">
                            You are responsible for safeguarding your login credentials, OAuth tokens, and API secret keys. Any activity occurring under your account is your responsibility. You agree to notify us immediately at <a href="mailto:pricepilot5@gmail.com" className="text-primary font-medium hover:underline">pricepilot5@gmail.com</a> upon suspecting unauthorized account access.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="space-y-3">
                        <h2 className="text-primary font-bold text-lg">5. Acceptable Use Policy</h2>
                        <p className="text-text-muted">
                            You agree not to misuse the platform, reverse-engineer proprietary elasticity models, intentionally overload scraping infrastructure, or use the service for deceptive or anti-competitive market manipulation that violates applicable consumer protection laws.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="space-y-3">
                        <h2 className="text-primary font-bold text-lg">6. Termination & Modifications</h2>
                        <p className="text-text-muted">
                            We reserve the right to modify these terms with reasonable advance notice. You may terminate your account at any time via the Settings dashboard.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="space-y-3 border-t border-border/40 pt-8">
                        <h2 className="text-primary font-bold text-lg">7. Contact & Support</h2>
                        <p className="text-text-muted">
                            For legal inquiries, terms clarification, or enterprise agreements, please reach out to our team at <a href="mailto:pricepilot5@gmail.com" className="text-primary font-semibold hover:underline">pricepilot5@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-8 text-center text-xs text-text-muted">
                <p>&copy; {new Date().getFullYear()} PricePilot AI. All rights reserved.</p>
            </footer>
        </div>
    );
}
