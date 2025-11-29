import { useState } from "react";
import { Search, ShieldAlert, Upload, ListFilter, User, LogOut } from "lucide-react";
import CVEFeed from "./components/CVEFeed";
import AuthModel from "./components/AuthModel";

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");
  const [jsonLocalDataUploaded, setJsonLocalDataUploaded] = useState(null);
  const [isLoginModuleOpen, setIsLoginModuleOpen] = useState(false);
  const [user, setUser] = useState(null); // null = not logged in

  const [doAuthModel, setDoAuthModel] = useState(false);
  const [userLoginSessionToken, setUserLoginSessionToken] = useState(null); // null = not logged in

  // successful login function:
  const doLoginSuccess = (newToken) => {
    setUserLoginSessionToken(newToken);
    setDoAuthModel(false);
  }

  // function for logging out/nulling the token:
  const doLogoutAndClearSessionToken = () => {
    setUserLoginSessionToken(null);
    setActiveTab("explore"); // switch back to the explore tab after logging out
  }

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
          <div className="relative flex items-center justify-between h-16">
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

            {/* User Auth login/logout buttons: */}
            <div>
              {/* if user login session token exists, show logout button */}
              {userLoginSessionToken ? (
                <button
                  onClick={doLogoutAndClearSessionToken}
                  className="flex items-center text-white space-x-2">
                    {/* using lucide-react logout icon: */}
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
              ) : (
                // if the user has not logged in yet, show the login button
                <button
                  onClick={() => setDoAuthModel(true)}
                  className="flex items-center text-white space-x-2">
                    {/* using lucide-react user icon: */}
                    <User size={20} />
                    <span>Login</span>
                  </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Enable the Auth Model if doAuthModel is true */}
      {doAuthModel && (
        <AuthModel
          closeTheAuthForm={() => setDoAuthModel(false)}
          whenUserLoginIsSuccessful={doLoginSuccess}
          />
      )}


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

    </div>
  );
}

