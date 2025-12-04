// CVE Feed Component (displays feed of CVE cards, receives CVE obejcts as props)
import { useState, useEffect } from 'react';
import CVECard from './CVECard';
import FilterPanel from './FilterPanel';
import { ChevronDown, ArrowRight, ArrowLeft } from 'lucide-react'; // Imports for buttons

function CVEFeed({ cves, onApplyFilters, totalCount, onNextPage, onPrevPage, page }) { 
  // Local state to control "Load More" (25 vs 50)
  const [visibleCount, setVisibleCount] = useState(25);

  // Whenever we receive new CVEs (e.g. Next/Prev Page clicked), reset view to 25
  useEffect(() => {
    setVisibleCount(25);
  }, [cves]);

  const handleLoadMore = () => {
    setVisibleCount(50); // Reveal the rest of the current batch
  };

  // Logic to show buttons
  const showLoadMore = visibleCount < cves.length;
  // Show Next Page if we have shown all fetched items AND there are 50 items (full page)
  const showNextPage = !showLoadMore && cves.length === 50;
  // Show Prev Page if we are not on page 0
  const showPrevPage = page > 0;

  // Calculate how many CVEs currently on screen
  const currentShown = Math.min(visibleCount, cves.length);

  return (
    <div className="space-y-8">
      {/* Filter Panel */}
      <FilterPanel onApplyFilters={onApplyFilters} />

      {/* CVE Cards */}    
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {cves.length > 0 ? "Vulnerabilities" : "No Vulnerabilities Found"}
            </h2>
          
            {/* Display CVEs "Showing X of Y" */}
            {totalCount > 0 && (
              <span className="text-lg text-gray-500 font-medium">
                (Showing {currentShown} of {totalCount} found) - Page {page + 1}
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
        
        {/* Slice the array to only show visibleCount */}
        {cves.slice(0, visibleCount).map((cve) => (
          <CVECard key={cve.id || cve.cveId} cve={cve} />
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

          {/* LOAD MORE BUTTON (25 -> 50) */}
          {showLoadMore && (
            <button 
              onClick={handleLoadMore}
              className="flex items-center px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-medium transition-colors"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Load More (Show 50)
            </button>
          )}

          {/* NEXT PAGE BUTTON (Fetches new batch) */}
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