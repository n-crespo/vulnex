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
          </nav>

          {/* User Auth login/logout buttons */}
          <div>
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
