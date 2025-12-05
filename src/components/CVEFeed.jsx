import CVECard from "./CVECard";
import FilterPanel from "./FilterPanel";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useUserDataContext } from "../context/UserDataContext";
import { useAuthContext } from "../context/AuthContext";

function CVEFeed({ cves, totalCount, onNextPage, onPrevPage, page }) {
  // Consume removeBookmark from Context
  const { isBookmarked, addBookmark, removeBookmark } = useUserDataContext();
  const { userLoginSessionToken, setDoAuthModel } = useAuthContext();

  // Logic to show buttons
  const itemsPerPage = 25;

  // Show Next Page if we have a full page of items
  const showNextPage = cves.length === itemsPerPage;
  // Show Prev Page if we are not on page 0
  const showPrevPage = page > 0;

  // Calculate Range logic
  const startRange = page * itemsPerPage + 1;
  const endRange = startRange + cves.length - 1;

  // [UPDATED] Smart Handler for Bookmark Click (Toggle Add/Remove)
  const handleBookmarkAction = (cveId) => {
    if (!userLoginSessionToken) {
      // User is NOT logged in -> Open Login Modal
      setDoAuthModel(true);
      return;
    }

    if (isBookmarked(cveId)) {
      removeBookmark(cveId);
    } else {
      addBookmark(cveId);
    }
  };

  return (
    <div className="space-y-8">
      <FilterPanel />

      {/* CVE Cards */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {cves.length > 0 ? "Vulnerabilities" : "No Vulnerabilities Found"}
            </h2>

            {/* Display CVEs "Showing X-Y of Z" */}
            {totalCount > 0 && (
              <span className="text-lg text-gray-500 font-medium">
                (Showing {startRange}-{endRange} of {totalCount} found)
              </span>
            )}
          </div>

          {/* Top Page Button (Prev/Next) */}
          <div className="flex space-x-2">
            {showPrevPage && (
              <button
                onClick={onPrevPage}
                className="flex items-center px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Prev
              </button>
            )}
            {showNextPage && (
              <button
                onClick={onNextPage}
                className="flex items-center px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Next
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Render CVEs */}
        {cves.map((cve) => (
          <CVECard
            key={cve.id || cve.cveId}
            cve={cve}
            // Pass Bookmark Props
            isBookmarked={isBookmarked(cve.cveId)}
            onBookmarkAction={() => handleBookmarkAction(cve.cveId)}
          />
        ))}

        {cves.length === 0 && (
          <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200">
            No vulnerabilities match your criteria.
          </div>
        )}

        {/* BOTTOM Buttons Area */}
        <div className="flex justify-center pt-4 pb-8 space-x-4">
          {/* PREVIOUS PAGE BUTTON */}
          {showPrevPage && (
            <button
              onClick={onPrevPage}
              className="flex items-center px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-full font-medium transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Page
            </button>
          )}

          {/* NEXT PAGE BUTTON */}
          {showNextPage && (
            <button
              onClick={onNextPage}
              className="flex items-center px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-full font-medium transition-colors shadow-sm"
            >
              Next Page
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CVEFeed;
