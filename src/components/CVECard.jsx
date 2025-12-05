import { memo } from "react";
import { Bookmark, Check } from "lucide-react"; // [NEW] Icons

// CVE Vulnerability Card Component
function CVECard({ cve, isBookmarked, onBookmarkAction }) {
  // Severity Color Mapping
  const getSeverityColor = (severity) => {
    const level = severity ? severity.toUpperCase() : "UNKNOWN"; // Default to Unknown if missing

    const colors = {
      CRITICAL: "bg-red-100 text-red-800 border-red-300",
      HIGH: "bg-orange-100 text-orange-800 border-orange-300",
      MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
      LOW: "bg-green-100 text-green-800 border-green-300",
      NONE: "bg-gray-100 text-gray-800 border-gray-300",
      UNKNOWN: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[level] || colors.UNKNOWN;
  };

  // Helper to format the version range from the array
  const getVersionDisplay = (versions) => {
    if (!versions || versions.length === 0) return "Not specified";
    // Just show the first range as an example, or "Multiple"
    const v = versions[0];
    return `${v.start || "?"} - ${v.end || "?"}`;
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
      
      {/* Bookmark Button (Always Visible) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Stop card click
          // Call parent handler (checks auth status)
          if(!isBookmarked && onBookmarkAction) onBookmarkAction(cve.cveId);
          else if (!onBookmarkAction) console.log("Action not bound"); // fallback
          // If not logged in, parent handler will open modal
          if (onBookmarkAction && isBookmarked === undefined) onBookmarkAction(cve.cveId); 
        }}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${
          isBookmarked ? "bg-blue-50 cursor-default" : "hover:bg-gray-100"
        }`}
        title={isBookmarked ? "Saved" : "Save to Profile"}
      >
        {isBookmarked ? (
          <Check className="w-5 h-5 text-blue-600" />
        ) : (
           <Bookmark className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Main Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-8">
          {/* CVE Header: ID and Severity */}
          <div className="flex items-center space-x-3 mb-2">
            {/* LINK TO NIST DATABASE */}
            <h3 className="text-lg font-semibold">
              <a
                href={`https://nvd.nist.gov/vuln/detail/${cve.cveId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-red-800 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {cve.cveId}
              </a>
            </h3>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(cve.severityLevel)}`}
            >
              {cve.severityLevel}
            </span>
          </div>

          {/* CVE Description */}
          <p className="text-gray-600 mb-3 text-sm line-clamp-3">
            {cve.description}
          </p>

          {/* CVE Details Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-gray-100">
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">Product:</span>{" "}
              {cve.productName}
            </span>

            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">Versions:</span>{" "}
              {getVersionDisplay(cve.productVersions)}
            </span>

            <span className="text-gray-500">
              {/* Date formatting */}
              Published: {formatDate(cve.published)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CVECard);
