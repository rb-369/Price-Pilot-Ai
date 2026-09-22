/**
 * Utility to warm up sleeping serverless/free-tier cloud containers (e.g. Render).
 *
 * Render web services spin down after 15 minutes of inactivity.
 * Triggering a non-blocking background ping on Landing or Dashboard arrival
 * warms up both the Python AI microservice and Express backend before the
 * user actively requests AI features (Ask AI, recommendations, forecasts, etc.).
 */

const DEFAULT_AI_URL = import.meta.env.DEV
    ? 'http://localhost:8000'
    : 'https://price-pilot-ai-service.onrender.com';

const AI_URL = (import.meta.env.VITE_AI_SERVICE_URL || DEFAULT_AI_URL).replace(/\/+$/, '');

let isWarming = false;

/**
 * Fires non-blocking health check requests to wake up sleeping services.
 * - Safe & silent: errors are swallowed so user interaction is never interrupted.
 * - Deduplicated: executes at most once per browser session.
 */
export function warmupAIService() {
    if (isWarming || typeof window === 'undefined') return;

    try {
        if (sessionStorage.getItem('pricepilot_ai_warmed')) {
            return;
        }
        sessionStorage.setItem('pricepilot_ai_warmed', 'true');
    } catch {
        // Handle environments where sessionStorage is disabled/restricted
    }

    isWarming = true;

    // Targets to warm up
    const targets = [];

    // 1. Python AI FastAPI microservice
    if (AI_URL) {
        targets.push(`${AI_URL}/api/health`);
    }

    // 2. Node.js Express API backend (if deployed on sleeping container)
    const rawApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '');
    if (rawApiUrl) {
        targets.push(`${rawApiUrl.replace(/\/+$/, '')}/health`);
    }

    // Dispatch lightweight background pings
    targets.forEach((endpoint) => {
        try {
            fetch(endpoint, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
            }).catch(() => {
                // Ignore cold start timeouts and errors silently
            });
        } catch {
            // Silently suppress
        }
    });
}
