import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE_URL, ENDPOINTS } from "../constants/api";

/**
 * Custom hook for managing all CVE data fetching, state, and pagination logic.
 * optimized with useCallback and useMemo to prevent unnecessary Context re-renders.
 */
export const useCveData = () => {
  // CVE Data States
  const [cves, setCves] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Page and Filter States
  const [page, setPage] = useState(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const abortControllerRef = useRef(null);

  // --- API Fetching Logic ---
  // We wrap this in useCallback so it doesn't get recreated on every render
  const fetchCVEs = useCallback(async (filters, pageNumber) => {
    // abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}${ENDPOINTS.CVES}`;

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
      if (err.name === "AbortError") {
        console.log("Fetch aborted");
        return;
      }
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []); // No dependencies needed as it uses params passed to it

  // Wrapper for Filter Panel
  const handleApplyFilters = useCallback(
    (filters) => {
      setCurrentFilters(filters);
      setPage(0);
      fetchCVEs(filters, 0);
    },
    [fetchCVEs],
  );

  // Wrapper for Next Page
  const handleNextPage = useCallback(() => {
    // We use functional state update (p => p + 1) to avoid depending on 'page'
    setPage((prevPage) => {
      const nextPage = prevPage + 1;
      fetchCVEs(currentFilters, nextPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return nextPage;
    });
  }, [fetchCVEs, currentFilters]);

  // Wrapper for Previous Page
  const handlePrevPage = useCallback(() => {
    setPage((prevPage) => {
      if (prevPage > 0) {
        const newPage = prevPage - 1;
        fetchCVEs(currentFilters, newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return newPage;
      }
      return prevPage;
    });
  }, [fetchCVEs, currentFilters]);

  // Initial fetch on mount
  useEffect(() => {
    // We only want this to run once on mount
    handleApplyFilters({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MEMOIZE the return value
  // This ensures the object reference stays the same unless data actually changes
  const contextValue = useMemo(
    () => ({
      cves,
      totalCount,
      isLoading,
      error,
      page,
      currentFilters,
      handleApplyFilters,
      handleNextPage,
      handlePrevPage,
    }),
    [
      cves,
      totalCount,
      isLoading,
      error,
      page,
      currentFilters,
      handleApplyFilters,
      handleNextPage,
      handlePrevPage,
    ],
  );

  return contextValue;
};
