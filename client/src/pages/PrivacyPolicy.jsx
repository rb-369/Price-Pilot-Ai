import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-surface flex flex-col text-text font-sans">
            <div className="max-w-4xl mx-auto px-4 py-12 w-full flex-1">
                <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors mb-8 font-medium">
                    <HiOutlineArrowLeft className="w-5 h-5" /> Back to Home
                </Link>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">Privacy Policy</h1>
                
                <div className="space-y-8 text-lg text-text-muted leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested, delivery notes, and other information you choose to provide.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4">2. Use of Information</h2>
                        <p>We may use the information we collect about you to provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request, develop new features, provide customer support, develop safety features, authenticate users, and send product updates and administrative messages.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4">3. Sharing of Information</h2>
                        <p>We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows: with vendors, consultants, marketing partners, and other service providers who need access to such information to carry out work on our behalf.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4">4. Data Security</h2>
                        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-text mb-4">5. Contact Us</h2>
                        <p>If you have any questions about this Privacy Statement, please contact us at privacy@pricepilot.ai.</p>
                    </section>
                </div>
            </div>
            
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
