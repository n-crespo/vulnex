import { useState, useEffect } from "react";
import { ShieldAlert, Upload, User, LogOut } from "lucide-react";
import CVEFeed from "./components/CVEFeed";
import AuthModel from "./components/AuthModel";

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");
  const [jsonLocalDataUploaded, setJsonLocalDataUploaded] = useState(null);

  // Auth States
  const [doAuthModel, setDoAuthModel] = useState(false);
  const [userLoginSessionToken, setUserLoginSessionToken] = useState(null); // null = not logged in
  // const [user, setUser] = useState(null); // null = not logged in

  // CVE Data States
  const [cves, setCves] = useState([]); // Stores the fetched CVEs
  const [totalCount, setTotalCount] = useState(0); // Store the total count of CVEs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Page States
  const [page, setPage] = useState(0);
  const [currentFilters, setCurrentFilters] = useState({});

  // API Base URL (Dynamic based on environment)
  const API_BASE_URL = (
    import.meta.env.DEV
      ? "http://localhost:3000"
      : "https://vulnex-api.onrender.com"
  ).replace(/\/$/, "");

  // Initial fetch on mount
  useEffect(() => {
    handleApplyFilters({}); // Fetch all (default limit: 25) on load
  }, []);

  // --- API Fetching Logic ---
  const fetchCVEs = async (filters, pageNumber) => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/api/cves`;

      // LOGIC: If a specific CVE ID is provided, use the ID endpoint: /api/cves/:id
      // Otherwise use the general query parameters
      if (filters.cveId) {
        url = `${url}/${filters.cveId}`;
      } else {
        // Construct Query Parameters for general search
        const params = new URLSearchParams();

        // filters
        if (filters.productName)
          params.append("productName", filters.productName);
        if (filters.version) params.append("version", filters.version);
        if (filters.severityLevel)
          params.append("severityLevel", filters.severityLevel);
        if (filters.keyword) params.append("keyword", filters.keyword);
        if (filters.publishedStart)
          params.append("publishedStart", filters.publishedStart);
        if (filters.publishedEnd)
          params.append("publishedEnd", filters.publishedEnd);

        // Fetch 25 at a time
        params.append("limit", "25");
        params.append("skip", (pageNumber * 25).toString());

        url = `${url}?${params.toString()}`;
      }

      console.log("Fetching from:", url);
      const response = await fetch(url);

      if (!response.ok) {
        // If 404, it means no results found. We clear the list.
        if (response.status === 404) {
          setCves([]);
          setTotalCount(0); // Reset count if 404
          return;
        }
        throw new Error("Failed to fetch CVEs");
      }

      // Extract Total Count from Headers
      const totalHeader = response.headers.get("X-Total-Count");

      const data = await response.json();

      if (Array.isArray(data)) {
        setCves(data);
        // If header exists use it, otherwise use array length
        setTotalCount(totalHeader ? parseInt(totalHeader, 10) : data.length);
      } else if (data && typeof data === "object") {
        setCves([data]);
        // Single ID lookup implies 1 result
        setTotalCount(1);
      } else {
        setCves([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapper for Filter Panel (Resets page to 0)
  const handleApplyFilters = (filters) => {
    setCurrentFilters(filters);
    setPage(0);
    fetchCVEs(filters, 0);
  };

  // Wrapper for Next Page (Increments page)
  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCVEs(currentFilters, nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Optional: Scroll to top
  };

  // [NEW] Wrapper for Previous Page (Decrements page)
  const handlePrevPage = () => {
    if (page > 0) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchCVEs(currentFilters, prevPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // successful login function:
  const doLoginSuccess = (newToken) => {
    setUserLoginSessionToken(newToken);
    setDoAuthModel(false);
  };

  // function for logging out/nulling the token:
  const doLogoutAndClearSessionToken = () => {
    setUserLoginSessionToken(null);
    setActiveTab("explore"); // switch back to the explore tab after logging out
  };

  // a function to upload a local json file:
  const uploadJSONFile = (event) => {
    const jsonFile = event.target.files[0];
    if (!jsonFile) return;

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
  };

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
                  className="flex items-center text-white space-x-2"
                >
                  {/* using lucide-react logout icon: */}
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              ) : (
                // if the user has not logged in yet, show the login button
                <button
                  onClick={() => setDoAuthModel(true)}
                  className="flex items-center text-white space-x-2"
                >
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
        {activeTab === "explore" ? (
          <div className="space-y-4">
            {/* Error States */}
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Loading State - Animate pulse instead of hiding content */}
            {isLoading && (
              <p className="text-center text-gray-500 mt-4 animate-pulse">
                Updating results...
              </p>
            )}

            {/* Always render CVEFeed so FilterPanel doesn't reset */}
            <CVEFeed
              cves={cves} // pass the real fetched data
              totalCount={totalCount} // pass the count prop
              onApplyFilters={handleApplyFilters}
              onNextPage={handleNextPage} // pass next page handler
              onPrevPage={handlePrevPage} // pass prev page handler
              page={page} // pass current page number
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

            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              {jsonLocalDataUploaded ? (
                // display the result if something was uploaded
                <pre className="text-left bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(jsonLocalDataUploaded, null, 2)}
                </pre>
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
