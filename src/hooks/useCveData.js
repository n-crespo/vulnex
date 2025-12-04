import { useState, useEffect } from "react";

// API Base URL (Dynamic based on environment)
const API_BASE_URL = (
  import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://vulnex-api.onrender.com"
).replace(/\/$/, "");

/**
 * Custom hook for managing all CVE data fetching, state, and pagination logic.
 */
export const useCveData = () => {
  // CVE Data States
  const [cves, setCves] = useState([]); // Stores the fetched CVEs
  const [totalCount, setTotalCount] = useState(0); // Store the total count of CVEs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Page and Filter States
  const [page, setPage] = useState(0); // Current page number (0-indexed)
  const [currentFilters, setCurrentFilters] = useState({});

  // --- API Fetching Logic ---
  const fetchCVEs = async (filters, pageNumber) => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/api/cves`;

      // LOGIC: If a specific CVE ID is provided, use the ID endpoint: /api/cves/:id
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
        if (response.status === 404) {
          setCves([]);
          setTotalCount(0);
          return;
        }
        throw new Error("Failed to fetch CVEs");
      }

      const totalHeader = response.headers.get("X-Total-Count");
      const data = await response.json();

      if (Array.isArray(data)) {
        setCves(data);
        setTotalCount(totalHeader ? parseInt(totalHeader, 10) : data.length);
      } else if (data && typeof data === "object") {
        setCves([data]);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Wrapper for Previous Page (Decrements page)
  const handlePrevPage = () => {
    if (page > 0) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchCVEs(currentFilters, prevPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    handleApplyFilters({}); // Fetch all (default limit: 25) on load
  }, []);

  return {
    cves,
    totalCount,
    isLoading,
    error,
    page,
    currentFilters,
    handleApplyFilters,
    handleNextPage,
    handlePrevPage,
  };
};
