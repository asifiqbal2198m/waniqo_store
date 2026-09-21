import axios from "axios";

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (
    envUrl &&
    envUrl.trim() &&
    !envUrl.includes("your-backend-name") &&
    !envUrl.includes("your-backend") &&
    !envUrl.includes("your-app-name") &&
    !envUrl.includes("waniqo-store-1.onrender.com")
  ) {
    let url = envUrl.trim();
    if (!url.endsWith("/")) url += "/";
    return url;
  }

  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://waniqo.onrender.com/api/";
  }

  return "http://127.0.0.1:8000/api/";
};

export const API_BASE_URL = getApiBaseUrl();

export const getProductFallbackImage = (productName = '') => {
  const name = String(productName || '').toLowerCase();
  if (name.includes('laptop') || name.includes('macbook') || name.includes('hp') || name.includes('dell') || name.includes('computer')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('phone') || name.includes('mobile') || name.includes('iphone') || name.includes('samsung') || name.includes('android')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('watch') || name.includes('smartwatch') || name.includes('band')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('headphone') || name.includes('audio') || name.includes('earphone') || name.includes('speaker') || name.includes('sound')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('cloth') || name.includes('shirt') || name.includes('shoe') || name.includes('fashion') || name.includes('wear')) {
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('camera') || name.includes('polaroid') || name.includes('photo')) {
    return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80';
};

export const getMediaUrl = (imagePath, productName = '') => {
  if (!imagePath) return getProductFallbackImage(productName);

  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

  if (typeof imagePath === 'string') {
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000')) {
      return imagePath.replace(/^https?:\/\/(127\.0\.0\.1|localhost):8000/, baseUrl);
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }

  return getProductFallbackImage(productName);
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Access Token if present
api.interceptors.request.use(
  (config) => {
    // Endpoints that should not attach an Authorization header if token is invalid or absent
    const publicEndpoints = [
      "accounts/register/",
      "accounts/login/",
      "products/",
      "products/categories/",
    ];

    const isPublic = publicEndpoints.some((ep) => config.url?.startsWith(ep));
    const token = localStorage.getItem("access_token");

    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized & Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const refreshUrl = API_BASE_URL.endsWith('/')
            ? `${API_BASE_URL}accounts/token/refresh/`
            : `${API_BASE_URL}/accounts/token/refresh/`;

          const res = await axios.post(refreshUrl, {
            refresh: refreshToken,
          });

          if (res.status === 200 && res.data.access) {
            localStorage.setItem("access_token", res.data.access);
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
        }
      }

      // If refresh fails or no refresh token, clear stale tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
    }

    return Promise.reject(error);
  }
);

export default api;