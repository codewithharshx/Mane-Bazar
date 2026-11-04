import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user?.isVerified) {
    return <Navigate to="/login" replace state={{ from: location, verificationRequired: true }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
