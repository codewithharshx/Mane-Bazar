import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

// Check if Google Client ID is configured
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isGoogleConfigured = googleClientId && !googleClientId.includes("your-");

// Render with or without Google OAuth based on configuration
const AppContent = (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 2800,
                className: "rounded-2xl",
                style: {
                  background: "#ffffff",
                  color: "#0f172a"
                }
              }}
            />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if (isGoogleConfigured) {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <GoogleOAuthProvider clientId={googleClientId}>
      {AppContent}
    </GoogleOAuthProvider>
  );
} else {
  ReactDOM.createRoot(document.getElementById("root")).render(AppContent);
}
