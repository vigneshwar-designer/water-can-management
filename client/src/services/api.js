import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  register: async (username, password) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export const settingsService = {
  get: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  update: async (data) => {
    const response = await api.put('/settings', data);
    return response.data;
  }
};

export const customerService = {
  list: async (search = '') => {
    const response = await api.get(`/customers?search=${search}`);
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/customers', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};

export const localCustomerService = {
  list: async (search = '', status = '') => {
    const response = await api.get(`/local-customers?search=${search}&status=${status}`);
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/local-customers/${id}`);
    return response.data;
  }
};

export const canService = {
  list: async (search = '', status = '') => {
    const response = await api.get(`/cans?search=${search}&status=${status}`);
    return response.data;
  },
  getByCanId: async (canId) => {
    const response = await api.get(`/cans/info/${canId}`);
    return response.data;
  },
  getHistory: async (canId) => {
    const response = await api.get(`/cans/history/${canId}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/cans', data);
    return response.data;
  },
  bulkGenerate: async (count, baseName) => {
    const response = await api.post('/cans/bulk', { count, baseName });
    return response.data;
  },
  update: async (id, status) => {
    const response = await api.put(`/cans/${id}`, { status });
    return response.data;
  }
};

export const transactionService = {
  list: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },
  deliverFixed: async (customerId, canIds, amountPaid, paymentMethod) => {
    const response = await api.post('/transactions/deliver/fixed', {
      customerId,
      canIds,
      amountPaid,
      paymentMethod
    });
    return response.data;
  },
  deliverLocal: async (name, phone, canIds, amountPaid, paymentMethod) => {
    const response = await api.post('/transactions/deliver/local', {
      name,
      phone,
      canIds,
      amountPaid,
      paymentMethod
    });
    return response.data;
  },
  returnCan: async (canId) => {
    const response = await api.post('/transactions/return', { canId });
    return response.data;
  }
};

export const paymentService = {
  list: async () => {
    const response = await api.get('/payments');
    return response.data;
  },
  collect: async (customerId, amount, paymentMethod, notes = '') => {
    const response = await api.post('/payments', {
      customerId,
      amount,
      paymentMethod,
      notes
    });
    return response.data;
  }
};

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  }
};

export const reportService = {
  getDaily: async (date = '') => {
    const response = await api.get(`/reports/daily?date=${date}`);
    return response.data;
  },
  getCustomers: async () => {
    const response = await api.get('/reports/customers');
    return response.data;
  },
  getCans: async () => {
    const response = await api.get('/reports/cans');
    return response.data;
  },
  getInventory: async () => {
    const response = await api.get('/reports/inventory');
    return response.data;
  }
};

export default api;
