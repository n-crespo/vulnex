import { useState, useEffect } from "react";
import AuthModel from "./components/AuthModel";
import Header from "./components/Header";
import AnalyzeView from "./components/AnalyzeView";
import ExploreView from "./components/ExploreView";

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userLoginSessionToken={userLoginSessionToken}
        setDoAuthModel={setDoAuthModel}
        doLogoutAndClearSessionToken={doLogoutAndClearSessionToken}
      />

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
          <ExploreView
            cves={cves}
            totalCount={totalCount}
            isLoading={isLoading}
            error={error}
            page={page}
            onApplyFilters={handleApplyFilters}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
          />
        ) : (
          <AnalyzeView />
        )}
      </main>
    </div>
  );
}
