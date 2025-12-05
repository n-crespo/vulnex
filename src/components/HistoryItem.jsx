import { useState, memo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const HistoryItem = memo(({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  // If expanded, show everything. If not, show first 10.
  const visibleIds = expanded ? entry.ids : entry.ids.slice(0, 10);
  const remainingCount = entry.ids.length - 10;
  const showToggle = entry.ids.length > 10;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-bold text-gray-900 block">
            {entry.filename || "Unknown File"}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(entry.timestamp).toLocaleString()}
          </span>
        </div>
        <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
          {entry.ids.length} Found
        </span>
      </div>

      {/* List IDs found in this upload */}
      <div className="flex flex-wrap gap-2 mt-3">
        {visibleIds.map((id) => (
          <a
            key={id}
            href={`https://nvd.nist.gov/vuln/detail/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`View ${id} on NVD`}
            // Added hover effects (underline, darker red) to indicate clickability
            className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 font-mono hover:bg-red-100 hover:text-red-900 hover:underline transition-colors"
          >
            {id}
          </a>
        ))}

        {/* Toggle Button */}
        {showToggle && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-200 transition-colors font-medium"
          >
            {expanded ? (
              <>
                Show Less <ChevronUp size={12} />
              </>
            ) : (
              <>
                +{remainingCount} more (View All) <ChevronDown size={12} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
});

export default HistoryItem;

