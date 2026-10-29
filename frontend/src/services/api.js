import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tradex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to catch 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear stale token
      const isAuthEndpoint = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('tradex_token');
        localStorage.removeItem('tradex_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const stocksApi = {
  getStocks: (params) => api.get('/stocks', { params }),
  getStock: (symbol) => api.get(`/stocks/${symbol}`),
  getStockHistory: (symbol, timeframe) => api.get(`/stocks/${symbol}/history`, { params: { timeframe } }),
  getMarketOverview: () => api.get('/stocks/overview/market'),
  getSectors: () => api.get('/stocks/sectors/list')
};

export const tradesApi = {
  buy: (data) => api.post('/trades/buy', data),
  sell: (data) => api.post('/trades/sell', data),
  getHistory: (params) => api.get('/trades/history', { params })
};

export const portfolioApi = {
  getPortfolio: () => api.get('/portfolio')
};

export const watchlistApi = {
  getWatchlist: () => api.get('/watchlist'),
  addToWatchlist: (symbol) => api.post('/watchlist', { symbol }),
  removeFromWatchlist: (symbol) => api.delete(`/watchlist/${symbol}`)
};

export default api;
