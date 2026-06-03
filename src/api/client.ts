import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  try {
    const persisted = localStorage.getItem('resource-forum-auth');
    const token = persisted ? JSON.parse(persisted).state?.token : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore malformed local storage and continue unauthenticated.
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败，请稍后重试';
    return Promise.reject(new Error(message));
  },
);
