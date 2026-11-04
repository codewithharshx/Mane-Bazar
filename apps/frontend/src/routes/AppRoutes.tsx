import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const HomePage          = lazy(() => import("../pages/HomePage"));
const ProductsPage      = lazy(() => import("../pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("../pages/ProductDetailPage"));
const StoreListPage     = lazy(() => import("../pages/StoreListPage"));
const StoreDetailPage   = lazy(() => import("../pages/StoreDetailPage"));
const CartPage          = lazy(() => import("../pages/CartPage"));
const CheckoutPage      = lazy(() => import("../pages/CheckoutPage"));
const OrdersPage        = lazy(() => import("../pages/OrdersPage"));
const OrderDetailPage   = lazy(() => import("../pages/OrderDetailPage"));
const ProfilePage       = lazy(() => import("../pages/ProfilePage"));
const LoginPage         = lazy(() => import("../pages/LoginPage"));
const RegisterPage      = lazy(() => import("../pages/RegisterPage"));
const VerifyEmailPage   = lazy(() => import("../pages/VerifyEmailPage"));
const WishlistPage      = lazy(() => import("../pages/WishlistPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));
const NotFoundPage      = lazy(() => import("../pages/NotFoundPage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("../pages/AdminDashboardPage"));
const AdminStoresPage    = lazy(() => import("../pages/AdminStoresPage"));
const AdminProductsPage  = lazy(() => import("../pages/AdminProductsPage"));
const AdminOrdersPage    = lazy(() => import("../pages/AdminOrdersPage"));
const AdminUsersPage     = lazy(() => import("../pages/AdminUsersPage"));
const AdminInventoryPage = lazy(() => import("../pages/AdminInventoryPage"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/stores"          element={<StoreListPage />} />
          <Route path="/stores/:storeId" element={<StoreDetailPage />} />
          <Route path="/products"        element={<ProductsPage />} />
          <Route path="/products/:slug"  element={<ProductDetailPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cart"              element={<CartPage />} />
            <Route path="/checkout"          element={<CheckoutPage />} />
            <Route path="/orders"            element={<OrdersPage />} />
            <Route path="/orders/:orderId"   element={<OrderDetailPage />} />
            <Route path="/profile"           element={<ProfilePage />} />
            <Route path="/wishlist"          element={<WishlistPage />} />
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route path="/admin"             element={<AdminDashboardPage />} />
            <Route path="/admin/stores"      element={<AdminStoresPage />} />
            <Route path="/admin/products"    element={<AdminProductsPage />} />
            <Route path="/admin/orders"      element={<AdminOrdersPage />} />
            <Route path="/admin/users"       element={<AdminUsersPage />} />
            <Route path="/admin/inventory"   element={<AdminInventoryPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

export default AppRoutes;
