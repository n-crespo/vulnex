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
      <h2 className="text-2xl font-bold text-gray-900">Recent Vulnerabilities</h2>
      
      {/* Map through CVEs and render a CVECard for each one */}
      {cves.map((cve) => (
        <CVECard key={cve.id} cve={cve} />
      ))}
      </div>
    </div>
  );
}

export default CVEFeed;