import axios from "axios";

const STORAGE_KEY = "mane-bazar-auth";
const DEFAULT_API_URL = "http://localhost:4000/api";
const API_BASE_URL = (((import.meta as any).env?.VITE_API_URL) || DEFAULT_API_URL).replace(/\/$/, "");
const CSRF_HEADER_NAME = "x-csrf-token";

let csrfTokenCache = "";

export const resetCsrfTokenCache = (): void => {
  csrfTokenCache = "";
};

export const getCsrfToken = async (forceRefresh = false): Promise<string> => {
  if (csrfTokenCache && !forceRefresh) return csrfTokenCache;
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/csrf`, {
      withCredentials: true,
    });
    csrfTokenCache = response.data.csrfToken || response.headers[CSRF_HEADER_NAME] || "";
    return csrfTokenCache;
  } catch (error: any) {
    console.warn("Failed to fetch CSRF token:", error.message);
    return "";
  }
};

const isUnsafeMethod = (method = ""): boolean => {
  const normalized = String(method).toUpperCase();
  return ["POST", "PUT", "PATCH", "DELETE"].includes(normalized);
};

export const getStoredAuth = (): { user: any | null } => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    return { user: parsed.user || null };
  } catch {
    return { user: null };
  }
};

export const saveStoredAuth = (payload: { user: any | null }): void => {
  const normalized = payload || {};
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user: (normalized as any).user || null })
  );
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  resetCsrfTokenCache();
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (isUnsafeMethod(config.method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      config.headers = config.headers || ({} as any);
      (config.headers as any)[CSRF_HEADER_NAME] = csrfToken;
    }
  }
  return config;
});

let refreshPromise: Promise<any> | null = null;

const refreshAccessTokenOnce = async (): Promise<any> => {
  if (!refreshPromise) {
    const csrfToken = await getCsrfToken(true);
    const headers = csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined;
    refreshPromise = axios
      .post(
        `${API_BASE_URL}/auth/refresh-token`,
        {},
        { withCredentials: true, headers }
      )
      .then((res) => {
        resetCsrfTokenCache();
        return res;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => {
    // If response returned a updated CSRF header or auth token, update cache
    if (response.headers?.[CSRF_HEADER_NAME]) {
      csrfTokenCache = response.headers[CSRF_HEADER_NAME];
    }
    if (response.config.url?.includes("/auth/login") || response.config.url?.includes("/auth/google")) {
      resetCsrfTokenCache();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 403 &&
      error.response?.data?.message?.toLowerCase().includes("csrf") &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      const newToken = await getCsrfToken(true);
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers[CSRF_HEADER_NAME] = newToken;
        return api(originalRequest);
      }
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        await refreshAccessTokenOnce();
        return api(originalRequest);
      } catch {
        clearStoredAuth();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
