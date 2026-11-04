import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../services/authApi";
import { clearStoredAuth, getStoredAuth, saveStoredAuth } from "../services/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredAuth().user || null);
  const [loading, setLoading] = useState(false);
  // Prevents the bootstrap effect from running twice in React Strict Mode
  const bootstrapped = useRef(false);

  // ── Bootstrap auth on mount (or when accessToken changes) ────────────────
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const bootstrapAuth = async () => {
      try {
        await authApi.csrfToken();
        const { data } = await authApi.me();
        setUser(data);
        saveStoredAuth({ user: data });
      } catch {
        try {
          const { data } = await authApi.refreshToken();
          setUser(data.user);
          saveStoredAuth({ user: data.user });
        } catch {
          clearStoredAuth();
          setUser(null);
        }
      }
    };

    bootstrapAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist auth to storage whenever it changes ───────────────────────────
  useEffect(() => {
    if (user) {
      saveStoredAuth({ user });
    }
  }, [user]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const handleAuthSuccess = (data, message) => {
    setUser(data.user);
    saveStoredAuth({ user: data.user });
    if (message) toast.success(message);
    return data;
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await authApi.register(payload);
      toast.success(data.message || "Verification email sent");
      return data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(payload);
      return handleAuthSuccess(data, "Logged in successfully");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const { data } = await authApi.googleAuth(credential);
      return handleAuthSuccess(data, "Signed in with Google");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email) => {
    const { data } = await authApi.resendVerification(email);
    toast.success(data.message);
    return data;
  };

  const requestPasswordReset = async (email) => {
    try {
      const { data } = await authApi.requestPasswordReset(email);
      toast.success(data.message || "Password reset link sent to your email");
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to request password reset";
      toast.error(msg);
      throw error;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const { data } = await authApi.resetPassword(token, password);
      toast.success(data.message || "Password reset successful");
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to reset password";
      toast.error(msg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API failures — clear locally regardless
    } finally {
      setUser(null);
      clearStoredAuth();
      toast.success("Logged out successfully");
    }
  };

  const refreshProfile = async () => {
    const { data } = await authApi.me();
    setUser(data);
    saveStoredAuth({ user: data });
    return data;
  };

  const updateProfile = async (payload) => {
    const { data } = await authApi.updateProfile(payload);
    setUser(data.user);
    toast.success(data.message);
    return data.user;
  };

  const addAddress = async (payload) => {
    const { data } = await authApi.addAddress(payload);
    setUser((current) => ({ ...current, addresses: data.addresses }));
    toast.success(data.message);
  };

  const updateAddress = async (addressId, payload) => {
    const { data } = await authApi.updateAddress(addressId, payload);
    setUser((current) => ({ ...current, addresses: data.addresses }));
    toast.success(data.message);
  };

  const deleteAddress = async (addressId) => {
    const { data } = await authApi.deleteAddress(addressId);
    setUser((current) => ({ ...current, addresses: data.addresses }));
    toast.success(data.message);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isVerified: user?.isVerified === true,
      loading,
      register,
      login,
      loginWithGoogle,
      resendVerification,
      requestPasswordReset,
      resetPassword,
      logout,
      refreshProfile,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress
    }),
    [user, loading] // eslint-disable-line react-hooks/exhaustive-deps
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
