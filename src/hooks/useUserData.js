import { useState, useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../constants/api";

export const useUserData = () => {
  const { userLoginSessionToken } = useAuthContext();
  
  const [savedCveIds, setSavedCveIds] = useState([]); // Bookmarks (IDs)
  const [foundHistory, setFoundHistory] = useState([]); // Upload History
  const [loadingUser, setLoadingUser] = useState(false);

  // Helper for authenticated fetch calls
  const authFetch = useCallback(async (endpoint, options = {}) => {
    if (!userLoginSessionToken) return;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.VITE_API_KEY || "", 
      "Authorization": `Bearer ${userLoginSessionToken}` 
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!res.ok) {
      throw new Error("Request failed");
    }
    return res.json();
  }, [userLoginSessionToken]);

  // Fetch all user data (Call this on login or profile load)
  const refreshUserData = useCallback(async () => {
    if (!userLoginSessionToken) return;
    setLoadingUser(true);
    try {
      // Fetch Bookmarks (savedCVEs)
      const saved = await authFetch("/api/users/me/savedCVEs");
      setSavedCveIds(saved || []);

      // Fetch Upload History (foundCVEs)
      const found = await authFetch("/api/users/me/foundCVEs");
      setFoundHistory(found || []);
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoadingUser(false);
    }
  }, [authFetch, userLoginSessionToken]);

  // Add Bookmark (saveCVEs)
  const addBookmark = useCallback(async (cveId) => {
    try {
      await authFetch("/api/users/me/savedCVEs", {
        method: "POST",
        body: JSON.stringify({ cveId }),
      });
      // Update local state immediately
      setSavedCveIds(prev => [...prev, cveId]);
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  }, [authFetch]);

  // Save Upload Result (foundCVEs)
  const saveUploadResult = useCallback(async (filename, cveIds) => {
    try {
      const payload = {
        ids: cveIds,
        timestamp: new Date().toISOString(),
        filename: filename
      };

      await authFetch("/api/users/me/foundCVEs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      // Refresh to ensure history is in sync
      refreshUserData();
    } catch (err) {
      console.error("Failed to save upload history:", err);
    }
  }, [authFetch, refreshUserData]);

  // Helper to check if a card is bookmarked
  const isBookmarked = useCallback((cveId) => {
    return savedCveIds.includes(cveId);
  }, [savedCveIds]);

  return {
    savedCveIds,
    foundHistory,
    loadingUser,
    refreshUserData,
    addBookmark,
    saveUploadResult,
    isBookmarked
  };
};