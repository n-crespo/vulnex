import { memo } from "react";
import CVEFeed from "./CVEFeed";
import { useCveDataContext } from "../context/CveDataContext";
import { Loader2 } from "lucide-react";

/**
 * Renders the main CVE exploration interface.
 * Consumes data directly from CveDataContext.
 */
function ExploreView() {
  const {
    cves,
    totalCount,
    isLoading,
    error,
    page,
    handleNextPage,
    handlePrevPage,
  } = useCveDataContext();

  return (
    <>
      {/* Floating Loading Indicator */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${
          isLoading ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="font-medium text-sm">Updating results...</span>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Opacity Transition for the Feed, makes the old data fade slightly while new data loads */}
      <div
        className={`transition-opacity duration-200 ${isLoading ? "opacity-60" : "opacity-100"}`}
      >
        <CVEFeed
          cves={cves}
          totalCount={totalCount}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          page={page}
        />
      </div>
    </>
  );
}

export default memo(ExploreView);
