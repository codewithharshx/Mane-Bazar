import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api, { clearStoredAuth, getStoredAuth, saveStoredAuth } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredAuth().user || null);
  const [accessToken, setAccessToken] = useState(getStoredAuth().accessToken || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (accessToken || user) return;
      try {
        const { data } = await api.post("/auth/refresh-token");
        setUser(data.user);
        setAccessToken(data.accessToken);
        saveStoredAuth({ user: data.user, accessToken: data.accessToken });
      } catch (error) {
        clearStoredAuth();
      }
    };

    bootstrapAuth();
  }, [accessToken, user]);

  useEffect(() => {
    if (user || accessToken) {
      saveStoredAuth({ user, accessToken });
    }
  }, [user, accessToken]);

  const handleAuthSuccess = (data, message) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    saveStoredAuth({ user: data.user, accessToken: data.accessToken });
    if (message) toast.success(message);
    return data;
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      return handleAuthSuccess(data, "Welcome to Mane Bazar");
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", payload);
      return handleAuthSuccess(data, "Logged in successfully");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { credential });
      return handleAuthSuccess(data, "Signed in with Google");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Ignore logout failures and clear local auth anyway.
    } finally {
      setUser(null);
      setAccessToken("");
      clearStoredAuth();
      toast.success("Logged out successfully");
    }
  };

  const refreshProfile = async () => {
    const { data } = await api.get("/auth/me");
    setUser(data);
    return data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put("/auth/profile", payload);
    setUser(data.user);
    toast.success(data.message);
    return data.user;
  };

  const addAddress = async (payload) => {
    const { data } = await api.post("/auth/addresses", payload);
    setUser((current) => ({ ...current, addresses: data.addresses }));
    toast.success(data.message);
  };

  const updateAddress = async (addressId, payload) => {
    const { data } = await api.put(`/auth/addresses/${addressId}`, payload);
    setUser((current) => ({ ...current, addresses: data.addresses }));
    toast.success(data.message);
  };

  const deleteAddress = async (addressId) => {
    const { data } = await api.delete(`/auth/addresses/${addressId}`);
    setUser((current) => ({ ...current, addresses: data.addresses }));
    toast.success(data.message);
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isAdmin: user?.role === "admin",
      loading,
      register,
      login,
      loginWithGoogle,
      logout,
      refreshProfile,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress
    }),
    [user, accessToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
