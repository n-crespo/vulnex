import { useState, useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";
import { API_BASE_URL, ENDPOINTS } from "../constants/api"; // Using your api.js constants

export const useUserData = () => {
  const { userLoginSessionToken } = useAuthContext();
  
  // Data States for the two "buckets" of user data
  const [savedCveIds, setSavedCveIds] = useState([]); // Bookmarks (Array of strings from DB)
  const [foundHistory, setFoundHistory] = useState([]); // Upload History (Array of objects from DB)
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
      // Silently fail/throw depending on preference, throwing for now
      throw new Error("Request failed");
    }
    return res.json();
  }, [userLoginSessionToken]);

  // Fetch all user data (Call this on login or profile load)
  // Endpoints based on newUserLogin.controller.js
  const refreshUserData = useCallback(async () => {
    if (!userLoginSessionToken) return;
    setLoadingUser(true);
    try {
      // Fetch Bookmarks (GET /me/savedCVEs)
      const saved = await authFetch("/api/users/me/savedCVEs");
      setSavedCveIds(saved || []);

      // Fetch Upload History (GET /me/foundCVEs)
      const found = await authFetch("/api/users/me/foundCVEs");
      setFoundHistory(found || []);
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoadingUser(false);
    }
  }, [authFetch, userLoginSessionToken]);

  // Add Bookmark (POST /me/savedCVEs)
  const addBookmark = useCallback(async (cveId) => {
    try {
      await authFetch("/api/users/me/savedCVEs", {
        method: "POST",
        body: JSON.stringify({ cveId }),
      });
      // Update local state immediately
      setSavedCveIds(prev => {
        if (prev.includes(cveId)) return prev;
        return [...prev, cveId];
      });
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  }, [authFetch]);

  // Save Upload Result (POST /me/foundCVEs)
  const saveUploadResult = useCallback(async (filename, cveIds) => {
    try {
      // Controller expects: { ids, timestamp, filename }
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