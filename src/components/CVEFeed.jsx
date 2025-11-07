// CVE Feed Component (displays feed of CVE cards, receives CVE objects as props)
import CVECard from './CVECard';
import SearchBar from './SearchBar';

function CVEFeed({ cves, searchQuery, setSearchQuery }) {
  return (
    <div className="space-y-8">
      {/* Search Bar Component */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

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