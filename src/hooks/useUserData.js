import { useState, useCallback } from "react";

// hook to manage User Data (Bookmarks & Upload Results).
// Acts as a 'Shell' for now, using local state.
// (replace the internal logic with API calls to save to the DB in future)

export const useUserData = () => {
  // --- Bookmarking Logic ---
  const [bookmarks, setBookmarks] = useState([]);

  const toggleBookmark = useCallback((cve) => {
    setBookmarks((prev) => {
      const isBookmarked = prev.some((b) => b.cveId === cve.cveId);
      if (isBookmarked) {
        // Remove
        return prev.filter((b) => b.cveId !== cve.cveId);
      } else {
        // Add
        return [...prev, cve];
      }
    });
  }, []);

  const isBookmarked = useCallback(
    (cveId) => {
      return bookmarks.some((b) => b.cveId === cveId);
    },
    [bookmarks],
  );

  // --- Analysis History Logic ---
  // Store the result of package.json analysis here so it persists when switching tabs
  const [lastAnalysisResult, setLastAnalysisResult] = useState(null);

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    lastAnalysisResult,
    setLastAnalysisResult,
  };
};