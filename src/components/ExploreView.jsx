import CVEFeed from "./CVEFeed";
import { useCveDataContext } from "../context/CveDataContext";

/**
 * Renders the main CVE exploration interface.
 * Consumes data directly from CveDataContext.
 */
export default function ExploreView() {
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
    <div className="space-y-4">
      {/* Error States */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Loading State - Animate pulse instead of hiding content */}
      {isLoading && (
        <p className="text-center text-gray-500 mt-4 animate-pulse">
          Updating results...
        </p>
      )}

      <CVEFeed
        cves={cves}
        totalCount={totalCount}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        page={page}
      />
    </div>
  );
}
