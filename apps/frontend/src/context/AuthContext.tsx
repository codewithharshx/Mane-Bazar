import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import toast from "react-hot-toast";
import { authApi } from "../services/authApi";
import { clearStoredAuth, getStoredAuth, saveStoredAuth } from "../services/apiClient";

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "user" | "admin";
  isVerified: boolean;
  avatar?: string;
  addresses?: any[];
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  loading: boolean;
  register: (payload: any) => Promise<any>;
  login: (payload: any) => Promise<any>;
  loginWithGoogle: (credential: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<any>;
  updateProfile: (payload: any) => Promise<any>;
  addAddress: (payload: any) => Promise<void>;
  updateAddress: (addressId: string, payload: any) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(getStoredAuth().user || null);
  const [loading, setLoading] = useState(false);
  const bootstrapped = useRef(false);

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
  }, []);

  useEffect(() => {
    if (user) saveStoredAuth({ user });
  }, [user]);

  const handleAuthSuccess = (data: any, message?: string) => {
    setUser(data.user);
    saveStoredAuth({ user: data.user });
    if (message) toast.success(message);
    return data;
  };

  const register = async (payload: any) => {
    setLoading(true);
    try {
      const { data } = await authApi.register(payload);
      toast.success(data.message || "Verification email sent");
      return data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload: any) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(payload);
      return handleAuthSuccess(data, "Logged in successfully");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const { data } = await authApi.googleAuth(credential);
      return handleAuthSuccess(data, "Signed in with Google");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    const { data } = await authApi.resendVerification(email);
    toast.success(data.message);
    return data;
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const { data } = await authApi.requestPasswordReset(email);
      toast.success(data.message || "Password reset link sent to your email");
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to request password reset";
      toast.error(msg);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const { data } = await authApi.resetPassword(token, password);
      toast.success(data.message || "Password reset successful");
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to reset password";
      toast.error(msg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout failures
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

  const updateProfile = async (payload: any) => {
    const { data } = await authApi.updateProfile(payload);
    setUser(data.user);
    toast.success(data.message);
    return data.user;
  };

  const addAddress = async (payload: any) => {
    const { data } = await authApi.addAddress(payload);
    setUser((current) => current ? { ...current, addresses: data.addresses } : current);
    toast.success(data.message);
  };

  const updateAddress = async (addressId: string, payload: any) => {
    const { data } = await authApi.updateAddress(addressId, payload);
    setUser((current) => current ? { ...current, addresses: data.addresses } : current);
    toast.success(data.message);
  };

  const deleteAddress = async (addressId: string) => {
    const { data } = await authApi.deleteAddress(addressId);
    setUser((current) => current ? { ...current, addresses: data.addresses } : current);
    toast.success(data.message);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN" || user?.role === "admin",
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
      deleteAddress,
    }),
    [user, loading] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
