import { useState, useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../constants/api";

export const useUserData = () => {
  const { userLoginSessionToken } = useAuthContext();

  const [savedCveIds, setSavedCveIds] = useState([]);
  const [foundHistory, setFoundHistory] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(false);

  // Helper for authenticated fetch calls
  const authFetch = useCallback(
    async (endpoint, options = {}) => {
      if (!userLoginSessionToken) return;

      const headers = {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_API_KEY || "",
        Authorization: `Bearer ${userLoginSessionToken}`,
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
    },
    [userLoginSessionToken],
  );

  // --- ACTIONS ---

  // Fetch all user data
  const refreshUserData = useCallback(async () => {
    if (!userLoginSessionToken) return;
    setLoadingUser(true);
    try {
      // Fetch Basic User Info (Email)
      const userProfile = await authFetch("/api/users/me");
      if (userProfile && userProfile.email) {
        setUserEmail(userProfile.email);
      }

      // Fetch Bookmarks
      const saved = await authFetch("/api/users/me/savedCVEs");
      setSavedCveIds(saved || []);

      // Fetch Upload History
      const found = await authFetch("/api/users/me/foundCVEs");
      setFoundHistory(found || []);
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoadingUser(false);
    }
  }, [authFetch, userLoginSessionToken]);

  // Add Bookmark (POST /me/savedCVEs)
  const addBookmark = useCallback(
    async (cveId) => {
      try {
        await authFetch("/api/users/me/savedCVEs", {
          method: "POST",
          body: JSON.stringify({ cveId }),
        });

        setSavedCveIds((prev) => {
          if (prev.includes(cveId)) return prev;
          return [...prev, cveId];
        });
      } catch (err) {
        console.error("Failed to bookmark:", err);
      }
    },
    [authFetch],
  );

  // Remove Bookmark
  const removeBookmark = useCallback(
    async (cveId) => {
      try {
        await authFetch("/api/users/me/savedCVEs", {
          method: "DELETE",
          body: JSON.stringify({ cveId }),
        });
        // Update local state immediately
        setSavedCveIds((prev) => prev.filter((id) => id !== cveId));
      } catch (err) {
        console.error("Failed to remove bookmark:", err);
      }
    },
    [authFetch],
  );

  // Save Upload Result (POST /me/foundCVEs)
  const saveUploadResult = useCallback(
    async (filename, cveIds) => {
      try {
        // Controller expects: { ids, timestamp, filename }
        const payload = {
          ids: cveIds,
          timestamp: new Date().toISOString(),
          filename: filename,
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
    },
    [authFetch, refreshUserData],
  );

  // Helper to check if a card is bookmarked
  const isBookmarked = useCallback(
    (cveId) => {
      return savedCveIds.includes(cveId);
    },
    [savedCveIds],
  );

  return {
    userEmail,
    savedCveIds,
    foundHistory,
    loadingUser,
    refreshUserData,
    addBookmark,
    removeBookmark,
    saveUploadResult,
    isBookmarked,
  };
};

