import CVEFeed from "./CVEFeed";

/**
 * Renders the main CVE exploration interface, including loading and error states.
 *
 * @param {object[]} cves - List of CVE objects to display.
 * @param {number} totalCount - Total number of CVEs matching the current filters.
 * @param {boolean} isLoading - Loading state indicator.
 * @param {string|null} error - Error message string, if any.
 * @param {number} page - Current page number (0-indexed).
 * @param {function} onApplyFilters - Handler to apply new filters and reset page.
 * @param {function} onNextPage - Handler to load the next page.
 * @param {function} onPrevPage - Handler to load the previous page.
 */
export default function ExploreView({
  cves,
  totalCount,
  isLoading,
  error,
  page,
  onApplyFilters,
  onNextPage,
  onPrevPage,
}) {
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

      {/* Always render CVEFeed so FilterPanel doesn't reset */}
      <CVEFeed
        cves={cves}
        totalCount={totalCount}
        onApplyFilters={onApplyFilters}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        page={page}
      />
    </div>
  );
}
