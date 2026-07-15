import { Component } from 'react';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-surface p-6">
                    <div className="glass-card p-10 max-w-md w-full text-center space-y-6 animate-slide-up">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-danger/10 flex items-center justify-center">
                            <HiOutlineExclamationTriangle className="w-8 h-8 text-danger" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
                            <p className="text-sm text-text-muted">
                                An unexpected error occurred. Please try again or refresh the page.
                            </p>
                        </div>
                        {/* eslint-disable-next-line no-undef */}
                        {typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && this.state.error && (
                            <div className="p-3 rounded-xl bg-surface/60 border border-danger/10 text-left">
                                <p className="text-xs text-danger/80 font-mono break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold
                                           hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-5 py-2.5 rounded-xl bg-surface-lighter text-text-muted text-sm font-semibold
                                           hover:text-text transition-all border border-[rgba(99,102,241,0.1)]"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
