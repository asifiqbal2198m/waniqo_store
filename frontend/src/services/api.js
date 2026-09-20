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

export const getMediaUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');

  if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000')) {
    return imagePath.replace(/^https?:\/\/(127\.0\.0\.1|localhost):8000/, baseUrl);
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
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