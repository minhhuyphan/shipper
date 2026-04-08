/**
 * Axios Instance Configuration
 * Chức năng: Khởi tạo trình gọi API, thiết lập Base URL và các Interceptor để xử lý Token/Lỗi 401.
 * Các thành phần chính: Interceptor request (đính kèm JWT), Interceptor response (tự động logout khi hết hạn).
 */
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
