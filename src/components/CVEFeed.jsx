// CVE Feed Component (displays feed of CVE cards, receives CVE objects as props)
import CVECard from './CVECard';
import FilterPanel from './FilterPanel';

function CVEFeed({ cves, onApplyFilters }) {
  return (
    <div className="space-y-8">
      {/* Filter Panel */}
      <FilterPanel onApplyFilters={onApplyFilters} />

      {/* CVE Cards */}    
      <div className="space-y-4">
        {/* Section Header */}
        <h2 className="text-2xl font-bold text-gray-900">
          {cves.length > 0 ? "Recent Vulnerabilities" : "No Vulnerabilities Found"}
        </h2>
        
        {/* CHANGED: Removed .slice(0,4) so it shows ALL fetched CVEs */}
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