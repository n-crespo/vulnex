import { useState } from 'react';
import { Search, ShieldAlert, Upload, ListFilter } from 'lucide-react';
import CVEFeed from './components/CVEFeed';

export default function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState('');

  // Placeholder CVE data -------------------------------------------------------
  const placeholderCVEs = [
    {
      id: 'CVE-0000-0000',
      title: 'Title Placeholder',
      severity: 'Critical',
      score: 9.9,
      package: '...',
      version: '< 0.12.3',
      description: 'Description...',
      published: 'XXXX-XX-XX'
    },
    {
      id: 'CVE-0000-0000',
      title: 'Title Placeholder',
      severity: 'High',
      score: 8,
      package: '...',
      version: '< 0.12.3',
      description: 'Description...',
      published: 'XXXX-XX-XX'
    },
    {
      id: 'CVE-0000-0000',
      title: 'Title Placeholder',
      severity: 'Medium',
      score: 6,
      package: '...',
      version: '< 0.12.3',
      description: 'Description...',
      published: 'XXXX-XX-XX'
    },
    {
      id: 'CVE-0000-0000',
      title: 'Title Placeholder',
      severity: 'Low',
      score: 2,
      package: '...',
      version: '< 0.12.3',
      description: 'Description...',
      published: 'XXXX-XX-XX'
    }
  ];

  // --------------------------------------------------------------------------------------


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-10 h-10 text-red-700" />
              <h1 className="text-3xl font-bold text-white font-mono">VulnEx</h1>
            </div>


            {/* Navigation Buttons */}
            <nav className="absolute left-1/2 -translate-x-1/2 flex space-x-4">
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'explore'
                    ? 'bg-red-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                }`}
              >
                Explore
              </button>
              <button
                onClick={() => setActiveTab('analyze')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'analyze'
                    ? 'bg-red-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-red-200'
                }`}
              >
                Analyze
              </button>
            </nav>



          </div>
        </div>
      </header>


      {/* Explore Content (Padding) */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'explore' ? (
          <div className="space-y-8">

            {/* Search Bar */}
            <div className="bg-white rounded-full shadow p-4 space-y-4">
              <div className="flex items-center space-x-4">
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
                <button className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                  <ListFilter className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">Sort</span>
                </button>
              </div>
            </div>


            {/* CVE Feed */}
            <CVEFeed cves={placeholderCVEs} />


          </div>
        ) : (

          
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analyze Your Project</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-red-300 transition-colors">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload package.json
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your package.json file here, or click to choose file
                </p>
                <button className="px-6 py-2 bg-red-400 text-white rounded-lg hover:bg-red-800 transition-colors">
                  Choose File
                </button>
              </div>
            </div>

            {/* Placeholder for results */}
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              <p>Upload a package.json file to see vulnerability analysis</p>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}