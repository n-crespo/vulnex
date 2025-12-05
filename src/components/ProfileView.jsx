import { useState, useEffect, memo } from "react";
import CVECard from "./CVECard";
import HistoryItem from "./HistoryItem";
import { useUserDataContext } from "../context/UserDataContext";
import { FileCode, Bookmark, Loader2 } from "lucide-react";
import { API_BASE_URL, ENDPOINTS } from "../constants/api"; 

function ProfileView() {
  const { savedCveIds, foundHistory, loadingUser } = useUserDataContext();
  
  const [hydratedBookmarks, setHydratedBookmarks] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
        const promises = savedCveIds.map(id => 
           fetch(`${API_BASE_URL}${ENDPOINTS.CVES}/${id}`).then(res => res.json())
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

  if (loadingUser) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- SECTION 1: SAVED BOOKMARKS --- */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
          <Bookmark className="text-red-700" />
          <h2 className="text-2xl font-bold text-gray-900">Saved Bookmarks</h2>
          <span className="text-gray-500 text-sm font-medium">
            ({savedCveIds.length})
          </span>
        </div>

        {loadingDetails ? (
           <div className="flex items-center gap-2 text-gray-500 p-8 justify-center bg-gray-50 rounded-lg">
             <Loader2 className="animate-spin" size={20}/> Loading Saved Vulnerabilities...
           </div>
        ) : hydratedBookmarks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500">
            You haven't bookmarked any CVEs yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {hydratedBookmarks.map((cve) => (
              <CVECard
                key={cve.cveId}
                cve={cve}
                isBookmarked={true} // Always true in this list
                showBookmarkBtn={true} 
                onToggleBookmark={() => {}} // No-op: Cannot remove yet based on backend limitations
              />
            ))}
          </div>
        )}
      </div>

      {/* --- SECTION 2: UPLOAD HISTORY --- */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
          <FileCode className="text-red-700" />
          <h2 className="text-2xl font-bold text-gray-900">Analysis History</h2>
        </div>

        {foundHistory.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-sm">
            No analysis history found.
          </div>
        ) : (
          <div className="space-y-3">
             {/* Reverse array to show newest first */}
             {[...foundHistory].reverse().map((entry, idx) => (
               <HistoryItem key={idx} entry={entry} />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProfileView);