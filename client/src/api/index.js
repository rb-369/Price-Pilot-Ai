import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

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

// Products
export const getProducts = () => api.get('/products');
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
export const getRecommendations = () => api.get('/ai/recommendations');
export const generateRecommendation = (productId) => api.post(`/ai/recommendations/${productId}`);
export const acceptRecommendation = (id) => api.put(`/ai/recommendations/${id}/accept`);
export const getForecasts = () => api.get('/ai/forecasts');
export const generateForecast = (productId, days) => api.post(`/ai/forecasts/${productId}`, { forecastDays: days });

// Alerts
export const getAlerts = () => api.get('/alerts');
export const getUnreadAlertCount = () => api.get('/alerts/unread-count');
export const markAlertRead = (id) => api.put(`/alerts/${id}/read`);
export const markAllAlertsRead = () => api.put('/alerts/read-all');

export default api;
