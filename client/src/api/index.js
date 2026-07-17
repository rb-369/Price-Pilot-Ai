import axios from 'axios';

// Resolve API base URL.
// - In production, VITE_API_URL MUST be set (otherwise the SPA rewrite returns
//   HTML for /api/* and every request appears to 404).
// - In development, fall back to the Vite dev-server proxy at /api.
const RAW_API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '');

if (!RAW_API_URL) {
    // Surface a clear, actionable error instead of letting the user chase
    // confusing 404s from the Vercel rewrite.
    console.error(
        '[PricePilot] VITE_API_URL is not set. Add it to your Vercel project ' +
        'environment variables (Settings → Environment Variables) and redeploy. ' +
        'Example: VITE_API_URL=https://api.your-domain.com/api'
    );
}

const API_URL = RAW_API_URL.replace(/\/+$/, ''); // strip trailing slash

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    // Don't accept HTML (the SPA rewrite) as a valid JSON response.
    responseType: 'json',
});

// Surface a friendlier error when the backend is unreachable or returns HTML.
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (!err.response) {
            // Network failure / CORS / DNS — backend not reachable.
            err.message = `Cannot reach the API server at ${API_URL || '(unset)'}. ` +
                `Set VITE_API_URL to your deployed backend and redeploy.`;
        }
        return Promise.reject(err);
    }
);

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getProfile = () => api.get('/auth/profile');
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (token, data) => api.post(`/auth/reset-password/${token}`, data);

// Products (paginated)
export const getProducts = (page = 1, limit = 20) => api.get(`/products?page=${page}&limit=${limit}`);
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Competitor Prices
export const getCompetitorPrices = (productId) => api.get(`/competitor-prices/${productId}`);
export const getLatestCompetitorPrices = () => api.get('/competitor-prices/latest');

// Demand Signals
export const getDemandSignals = (productId) => api.get(`/demand-signals/${productId}`);
export const getAllDemandSignals = () => api.get('/demand-signals');

// AI
export const getDashboardStats = () => api.get('/ai/dashboard-stats');
export const getChartData = (days = 30) => api.get(`/ai/chart-data?days=${days}`);
export const getRecommendations = (page = 1, limit = 20) => api.get(`/ai/recommendations?page=${page}&limit=${limit}`);
export const generateRecommendation = (productId) => api.post(`/ai/recommendations/${productId}`);
export const acceptRecommendation = (id) => api.put(`/ai/recommendations/${id}/accept`);
export const rejectRecommendation = (id, reason = '') => api.put(`/ai/recommendations/${id}/reject`, { reason });
export const revertRecommendation = (id) => api.put(`/ai/recommendations/${id}/revert`);
export const getForecasts = (page = 1, limit = 20) => api.get(`/ai/forecasts?page=${page}&limit=${limit}`);
export const generateForecast = (productId, days) => api.post(`/ai/forecasts/${productId}`, { forecastDays: days });
export const generateProductDescription = (data) => api.post('/ai/generate-description', data);
export const getJobStatus = (jobId) => api.get(`/ai/jobs/${jobId}`);

// Chats (New feature)
export const getChats = () => api.get('/chats');
export const getChat = (id) => api.get(`/chats/${id}`);
export const createChat = (data) => api.post('/chats', data);
export const deleteChat = (id) => api.delete(`/chats/${id}`);
export const sendChatMessage = (id, data) => api.post(`/chats/${id}/message`, data);
export const uploadChatContext = (formData) => api.post('/chats/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Alerts
export const getAlerts = () => api.get('/alerts');
export const getUnreadAlertCount = () => api.get('/alerts/unread-count');
export const markAlertRead = (id) => api.put(`/alerts/${id}/read`);
export const markAllAlertsRead = () => api.put('/alerts/read-all');

// Integrations
export const getIntegrations = () => api.get('/integrations');
export const connectShopify = (data) => api.post('/integrations/shopify', data);
export const disconnectIntegration = (id) => api.delete(`/integrations/${id}`);
export const syncShopifyProducts = () => api.post('/integrations/shopify/sync');

export default api;
