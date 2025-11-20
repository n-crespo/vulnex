import { useState } from 'react';
import { ShieldAlert, Upload, User } from 'lucide-react';
import CVEFeed from './components/CVEFeed';
import LoginModule from './components/LoginModule';

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");
  const [jsonLocalDataUploaded, setJsonLocalDataUploaded] = useState(null);
  const [isLoginModuleOpen, setIsLoginModuleOpen] = useState(false);
  const [user, setUser] = useState(null); // null = not logged in

  // Placeholder CVE data -------------------------------------------------------
  const placeholderCVEs = [
    {
      id: "CVE-0000-0000",
      title: "Title Placeholder",
      severity: "Critical",
      score: 9.9,
      package: "...",
      version: "< 0.12.3",
      description: "Description...",
      published: "XXXX-XX-XX",
    },
    {
      id: 'CVE-0000-0001',
      title: 'Title Placeholder',
      severity: 'High',
      score: 8,
      package: "...",
      version: "< 0.12.3",
      description: "Description...",
      published: "XXXX-XX-XX",
    },
    {
      id: 'CVE-0000-0002',
      title: 'Title Placeholder',
      severity: 'Medium',
      score: 6,
      package: "...",
      version: "< 0.12.3",
      description: "Description...",
      published: "XXXX-XX-XX",
    },
    {
      id: 'CVE-0000-0003',
      title: 'Title Placeholder',
      severity: 'Low',
      score: 2,
      package: "...",
      version: "< 0.12.3",
      description: "Description...",
      published: "XXXX-XX-XX",
    },
  ];

  // a function to upload a local json file:
  const uploadJSONFile = (event) => {
    const jsonFile = event.target.files[0];
    if (!jsonFile) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        const jsonParsedResult = JSON.parse(fileReader.result);
        setJsonLocalDataUploaded(jsonParsedResult);
      } catch {
        console.log("Error - bad JSON upload");
      }
    };
    fileReader.readAsText(jsonFile);
  }

    // Login Handler

    // Handle successful login
    const handleLogin = (userData) => {
      setUser(userData);
      console.log('User logged in:', userData);
    };

    // Handle logout
    const handleLogout = () => {
      setUser(null);
      console.log('User logged out');
    };


    // Handle Filter Application
    const handleApplyFilters = (filters) => {
      console.log('Filters received in App.jsx:', filters);
      // TODO: Implement API calls with these filters to backend
      // FOR NOW: Logging to console
    }

  // --------------------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-10 h-10 text-red-700" />
              <h1 className="text-3xl font-bold text-white font-mono">
                VulnEx
              </h1>
            </div>

            {/* Navigation Buttons */}
            <nav className="absolute left-1/2 -translate-x-1/2 flex space-x-4">
              <button
                onClick={() => setActiveTab("explore")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "explore"
                    ? "bg-red-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-red-200"
                }`}
              >
                Explore
              </button>
              <button
                onClick={() => setActiveTab("analyze")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "analyze"
                    ? "bg-red-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-red-200"
                }`}
              >
                Analyze
              </button>
            </nav>

              {/* User Section - Top Right */}
            <div className="absolute right-0">
              {user ? (
                // Logged in - show username and logout
                <div className="flex items-center space-x-3">
                  <span className="text-white text-sm">
                    Welcome, <span className="font-semibold">{user.username}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                // Not logged in - show user icon button
                <button
                  onClick={() => setIsLoginModuleOpen(true)}
                  className="flex items-center space-x-2 text-white hover:text-red-300 transition-colors"
                >
                  <User className="w-6 h-6" />
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Explore Content (Padding) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'explore' ? (
          <div className="space-y-4">

            {/* CVE Feed */}
            <CVEFeed 
              cves={placeholderCVEs}
              onApplyFilters={handleApplyFilters}
            />


          </div>
        ) : (
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Analyze Your Project
              </h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-red-300 transition-colors">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload package.json
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your package.json file here, or click to choose
                  file
                </p>
                {/* <button className="px-6 py-2 bg-red-400 text-white rounded-lg hover:bg-red-800 transition-colors">
                  Choose File
                </button> */}
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={uploadJSONFile}
                    className="hidden"
                  />
                  <span className="px-6 py-2 bg-red-400 text-white rounded-lg hover:bg-red-800 transition-colors cursor-pointer inline-block">
                    Choose File
                  </span>
                </label>
              </div>
            </div>

            {/* Placeholder for results */}
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              {jsonLocalDataUploaded ? (
                // display the result if something was uploaded
                <pre>{JSON.stringify(jsonLocalDataUploaded, null, 2)}</pre>
              ) : (
                <p>Upload a package.json file to see vulnerability analysis</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Login Module */}
      <LoginModule 
        isOpen={isLoginModuleOpen}
        onClose={() => setIsLoginModuleOpen(false)}
        onLogin={handleLogin}
      />

    </div>
  );
}

