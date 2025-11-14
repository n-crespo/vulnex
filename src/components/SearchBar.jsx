// Search Bar & Filter Component
import { Search, ListFilter } from 'lucide-react';

// Props for controlled input
function SearchBar({ searchQuery, setSearchQuery }) {
  
  const handleFilterClick = () => {
    // TODO: Implement filter functionality //
    console.log('Filter button clicked');
  };

  return (
    <div className="bg-white rounded-full shadow p-4 space-y-4">
      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search CVEs by keyword, package name, or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
        </div>
        
        {/* Sort Bar */}
        <button 
          onClick={handleFilterClick}
          className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ListFilter className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700 font-medium">Sort</span>
        </button>
      </div>
    </div>
  );
}

export default SearchBar;