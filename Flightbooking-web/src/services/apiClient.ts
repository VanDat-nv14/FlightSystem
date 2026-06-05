import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { API_BASE_URL } from './config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request: Tự động đính kèm Token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response: Xử lý lỗi 401 (Hết hạn Token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu lỗi 401 và chưa thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { refreshToken } = useAuthStore.getState();
        
        // Cố gắng lấy token mới (cookie được tự động gửi kèm nhờ withCredentials: true)
        const res = await axios.post(`${API_BASE_URL}/Auth/refresh`, {
          refreshToken: refreshToken || undefined
        }, {
          withCredentials: true
        });
        
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data;
        
        // Cập nhật store
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken || "");
        
        // Gửi lại request ban đầu với token mới
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        // Nếu refresh thất bại, bắt buộc đăng xuất
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
