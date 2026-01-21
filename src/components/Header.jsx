import { ShieldAlert, User, LogOut } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";

/**
 * Header component handling navigation tabs and authentication buttons.
 *
 * @param {string} activeTab - The currently active tab ('explore' or 'analyze').
 * @param {function} setActiveTab - Function to change the active tab.
 */
export default function Header({ activeTab, setActiveTab }) {
  const {
    userLoginSessionToken,
    setDoAuthModel,
    doLogoutAndClearSessionToken,
  } = useAuthContext();

  // Function to handle logout and ensure we switch back to the 'explore' tab
  const handleLogout = () => {
    doLogoutAndClearSessionToken();
    setActiveTab("explore");
  };

  // Smart handler for Profile Click
  const handleProfileClick = () => {
    if (userLoginSessionToken) {
      // If logged in, go to profile
      setActiveTab("profile");
    } else {
      // If NOT logged in, show Login Modal
      setDoAuthModel(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-10 h-10 text-red-700" />
            <h1 className="text-3xl font-bold text-white font-mono">VulnEx</h1>
          </div>

          {/* Navigation Buttons */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex space-x-4">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "explore"
                  ? "bg-red-800 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-red-200"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab("analyze")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "analyze"
                  ? "bg-red-800 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-red-200"
              }`}
            >
              Analyze
            </button>

            {/* Profile Button (Always visible) */}
            <button
              onClick={handleProfileClick}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-red-800 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-red-200"
              }`}
            >
              Profile
            </button>
          </nav>

          {/* User Auth login/logout buttons */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/n-crespo/vulnex"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors"
              title="View Source Code"
            >
              <GithubIcon size={20} />
            </a>

            {userLoginSessionToken ? (
              <button
                onClick={handleLogout}
                className="flex items-center text-red-400 hover:text-red-300 space-x-2 transition-colors"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setDoAuthModel(true);
                }}
                className="flex items-center text-white hover:text-gray-300 space-x-2 transition-colors"
              >
                <User size={20} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// custom component to replace deprecated Lucide Github icon
function GithubIcon({ size = 24, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
