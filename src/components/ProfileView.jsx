import { useState, useEffect, memo } from "react";
import CVECard from "./CVECard";
import HistoryItem from "./HistoryItem";
import { useUserDataContext } from "../context/UserDataContext";
import {
  FileCode,
  Bookmark,
  Loader2,
  ArrowLeft,
  ArrowRight,
  User,
} from "lucide-react";
import { API_BASE_URL, ENDPOINTS } from "../constants/api";

function ProfileView() {
  // Consume removeBookmark and userEmail
  const { savedCveIds, foundHistory, loadingUser, removeBookmark, userEmail } =
    useUserDataContext();

  const [hydratedBookmarks, setHydratedBookmarks] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pagination States
  const [bookmarkPage, setBookmarkPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const ITEMS_PER_PAGE = 5;

  // Fetch full details for bookmarked IDs
  // (Because backend only stores "CVE-2024-1234", but CVECard needs title, description, severity...)
  useEffect(() => {
    const fetchDetails = async () => {
      if (savedCveIds.length === 0) {
        setHydratedBookmarks([]);
        return;
      }

      setLoadingDetails(true);
      try {
        // Fetch each CVE details in parallel
        // Note: In a production app, a "bulk fetch" endpoint (POST /api/cves/bulk) is better/faster
        const promises = savedCveIds.map((id) =>
          fetch(`${API_BASE_URL}${ENDPOINTS.CVES}/${id}`).then((res) =>
            res.json(),
          ),
        );

        const results = await Promise.all(promises);
        // Filter out any nulls if a CVE was deleted from DB but still in bookmarks
        setHydratedBookmarks(results.filter(Boolean));
      } catch (err) {
        console.error("Failed to load bookmark details", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [savedCveIds]);

  // --- Pagination Logic: Bookmarks ---
  const bookmarkCount = hydratedBookmarks.length;
  const visibleBookmarks = hydratedBookmarks.slice(
    bookmarkPage * ITEMS_PER_PAGE,
    (bookmarkPage + 1) * ITEMS_PER_PAGE,
  );
  const showBookmarkPrev = bookmarkPage > 0;
  const showBookmarkNext = (bookmarkPage + 1) * ITEMS_PER_PAGE < bookmarkCount;

  // --- Pagination Logic: History ---
  const reversedHistory = [...foundHistory].reverse();
  const historyCount = reversedHistory.length;
  const visibleHistory = reversedHistory.slice(
    historyPage * ITEMS_PER_PAGE,
    (historyPage + 1) * ITEMS_PER_PAGE,
  );
  const showHistoryPrev = historyPage > 0;
  const showHistoryNext = (historyPage + 1) * ITEMS_PER_PAGE < historyCount;

  // Helper to render the Top Mini Controls
  const renderPaginationControls = (page, setPage, showPrev, showNext) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setPage((p) => p - 1)}
        disabled={!showPrev}
        className={`p-1 rounded-md transition-colors ${
          showPrev
            ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            : "text-gray-300 cursor-default"
        }`}
        title="Previous Page"
      >
        <ArrowLeft size={16} />
      </button>

      <span className="text-xs text-gray-500 font-medium min-w-[3rem] text-center select-none">
        Page {page + 1}
      </span>

      <button
        onClick={() => setPage((p) => p + 1)}
        disabled={!showNext}
        className={`p-1 rounded-md transition-colors ${
          showNext
            ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            : "text-gray-300 cursor-default"
        }`}
        title="Next Page"
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );

  if (loadingUser)
    return (
      <div className="p-8 text-center text-gray-500">Loading Profile...</div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* User Info Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="bg-red-100 p-3 rounded-full">
          <User className="w-8 h-8 text-red-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 font-medium">
            {userEmail || "Guest User"}
          </p>
        </div>
      </div>

      {/* --- SECTION 1: SAVED BOOKMARKS --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center space-x-2">
            <Bookmark className="text-red-700" />
            <h2 className="text-2xl font-bold text-gray-900">
              Saved Bookmarks
            </h2>
            <span className="text-gray-500 text-sm font-medium">
              ({savedCveIds.length})
            </span>
          </div>

          {/* Top Pagination Controls */}
          {savedCveIds.length > 0 &&
            renderPaginationControls(
              bookmarkPage,
              setBookmarkPage,
              showBookmarkPrev,
              showBookmarkNext,
            )}
        </div>

        {loadingDetails ? (
          <div className="flex items-center gap-2 text-gray-500 p-8 justify-center bg-gray-50 rounded-lg">
            <Loader2 className="animate-spin" size={20} /> Loading Saved
            Vulnerabilities...
          </div>
        ) : hydratedBookmarks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500">
            You haven't bookmarked any CVEs yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {visibleBookmarks.map((cve) => (
                <CVECard
                  key={cve.cveId}
                  cve={cve}
                  isBookmarked={true}
                  showBookmarkBtn={true}
                  onBookmarkAction={() => removeBookmark(cve.cveId)}
                />
              ))}
            </div>

            {/* Bottom Buttons (Kept for convenience on long lists) */}
            {(showBookmarkPrev || showBookmarkNext) && (
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setBookmarkPage((p) => p - 1)}
                  disabled={!showBookmarkPrev}
                  className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showBookmarkPrev ? "opacity-0 cursor-default" : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"}`}
                >
                  <ArrowLeft className="w-3 h-3 mr-1" /> Prev
                </button>
                <button
                  onClick={() => setBookmarkPage((p) => p + 1)}
                  disabled={!showBookmarkNext}
                  className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showBookmarkNext ? "opacity-0 cursor-default" : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"}`}
                >
                  Next <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- SECTION 2: UPLOAD HISTORY --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center space-x-2">
            <FileCode className="text-red-700" />
            <h2 className="text-2xl font-bold text-gray-900">
              Analysis History
            </h2>
          </div>

          {/* Top Pagination Controls */}
          {foundHistory.length > 0 &&
            renderPaginationControls(
              historyPage,
              setHistoryPage,
              showHistoryPrev,
              showHistoryNext,
            )}
        </div>

        {foundHistory.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-sm">
            No analysis history found.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visibleHistory.map((entry, idx) => (
                <HistoryItem key={idx} entry={entry} />
              ))}
            </div>

            {/* Bottom Buttons */}
            {(showHistoryPrev || showHistoryNext) && (
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setHistoryPage((p) => p - 1)}
                  disabled={!showHistoryPrev}
                  className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showHistoryPrev ? "opacity-0 cursor-default" : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"}`}
                >
                  <ArrowLeft className="w-3 h-3 mr-1" /> Prev
                </button>
                <button
                  onClick={() => setHistoryPage((p) => p + 1)}
                  disabled={!showHistoryNext}
                  className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showHistoryNext ? "opacity-0 cursor-default" : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"}`}
                >
                  Next <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(ProfileView);

