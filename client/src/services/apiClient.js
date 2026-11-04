import axios from "axios";

const STORAGE_KEY = "mane-bazar-auth";
const DEFAULT_API_URL = "http://localhost:5000/api";
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_COOKIE_NAME = "csrfToken";

const getCookie = (name) => {
  if (typeof document === "undefined") return "";

  const encoded = encodeURIComponent(name) + "=";
  const entry = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(encoded));
  if (!entry) return "";
  return decodeURIComponent(entry.slice(encoded.length));
};

let csrfTokenCache = "";

const getCsrfToken = async () => {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/csrf`, { withCredentials: true });
    csrfTokenCache = response.data.csrfToken || response.headers[CSRF_HEADER_NAME];
    return csrfTokenCache;
  } catch (error) {
    console.warn("Failed to fetch CSRF token:", error.message);
    return "";
  }
};

const isUnsafeMethod = (method = "") => {
  const normalized = String(method).toUpperCase();
  return ["POST", "PUT", "PATCH", "DELETE"].includes(normalized);
};

export const getStoredAuth = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return {
      user: parsed.user || null
    };
  } catch (error) {
    return { user: null };
  }
};

export const saveStoredAuth = (payload) => {
  const normalized = payload || {};
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: normalized.user || null }));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true
});

api.interceptors.request.use(async (config) => {
  if (isUnsafeMethod(config.method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers[CSRF_HEADER_NAME] = csrfToken;
    }
  }

  return config;
});

let refreshPromise = null;

const refreshAccessTokenOnce = async () => {
  if (!refreshPromise) {
    const csrfToken = await getCsrfToken();
    const headers = csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined;

    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true, headers })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        await refreshAccessTokenOnce();
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredAuth();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
