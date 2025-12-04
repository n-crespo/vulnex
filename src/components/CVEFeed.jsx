// CVE Feed Component (displays feed of CVE cards, receives CVE obejcts as props)
import CVECard from './CVECard';
import FilterPanel from './FilterPanel';

function CVEFeed({ cves, onApplyFilters, totalCount }) { // Accept totalCount prop
  return (
    <div className="space-y-8">
      {/* Filter Panel */}
      <FilterPanel onApplyFilters={onApplyFilters} />

      {/* CVE Cards */}    
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {cves.length > 0 ? "Vulnerabilities" : "No Vulnerabilities Found"}
          </h2>
        
          {/* Display Total Count if we have results */}
          {totalCount > 0 && (
            <span className="text-lg text-gray-500 font-medium">
              ({totalCount} found)
            </span>
          )}
        </div>
        
        {cves.map((cve) => (
          <CVECard key={cve.id || cve.cveId} cve={cve} />
        ))}

        {cves.length === 0 && (
          <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200">
            No vulnerabilities match your criteria.
          </div>
        )}
      </div>
    </div>
  );
}

export default CVEFeed;