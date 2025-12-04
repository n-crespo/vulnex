import { useState } from "react";
import { X, Lock, Mail, UserPlus, LogIn } from "lucide-react"; // Added icons for better UX
import { useAuthContext } from "../context/AuthContext";

// Ensure you have this file created as discussed, or replace with logic below
import { API_BASE_URL } from "../constants/api";

export default function AuthModel() {
  const { setDoAuthModel, doLoginSuccess } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newUserRegistering, setNewUserRegistering] = useState(false);
  const [noticeBoardMessage, setNoticeBoardMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userButtonSubmit = async (e) => {
    e.preventDefault();
    setNoticeBoardMessage("");
    setIsLoading(true);

    // Fallback if constants file isn't made yet
    const BASE = API_BASE_URL || "https://vulnex-api.onrender.com";

    const endpoint = newUserRegistering
      ? "/api/users/register"
      : "/api/users/login";

    const fullPath = BASE + endpoint;

    try {
      const response = await fetch(fullPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (newUserRegistering) {
        setNewUserRegistering(false);
        setNoticeBoardMessage("Successfully registered. Please log in.");
        // Clear password field for security after registration
        setPassword("");
      } else {
        doLoginSuccess(data.loginSessionToken);
      }
    } catch (err) {
      setNoticeBoardMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. Overlay: Full screen, semi-transparent black background, centered content
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* 2. Modal Card: White background, shadow, max-width */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => setDoAuthModel(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header Section */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {newUserRegistering ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {newUserRegistering
              ? "Join to bookmark CVEs and track vulnerabilities"
              : "Login to access your saved preferences"}
          </p>
        </div>

        {/* Body Section */}
        <div className="p-8">
          {noticeBoardMessage && (
            <div
              className={`mb-6 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                noticeBoardMessage.includes("Success")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {noticeBoardMessage}
            </div>
          )}

          <form onSubmit={userButtonSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  {newUserRegistering ? (
                    <UserPlus size={18} />
                  ) : (
                    <LogIn size={18} />
                  )}
                  {newUserRegistering ? "Sign Up" : "Sign In"}
                </>
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {newUserRegistering
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                onClick={() => {
                  setNewUserRegistering(!newUserRegistering);
                  setNoticeBoardMessage("");
                }}
                className="ml-2 font-semibold text-red-700 hover:text-red-900 transition-colors"
              >
                {newUserRegistering ? "Log in" : "Register"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
