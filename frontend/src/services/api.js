import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Перехватчик запросов для добавления токена
api.interceptors.request.use(
  (config) => {
    // ИСПРАВЛЕНО: используем ключ 'token' вместо 'accessToken'
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;