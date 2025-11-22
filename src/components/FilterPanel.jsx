// src/components/FilterPanel.jsx

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

// FilterPanel component - handles all CVE filtering options
function FilterPanel({ onApplyFilters }) {
  // Individual filter states
  const [cveId, setCveId] = useState('');
  const [severityRange, setSeverityRange] = useState([0, 10]); // [min, max]
  const [publishedDateIndex, setPublishedDateIndex] = useState([0, 5]); // [min, max] indices
  const [product, setProduct] = useState('');
  const [keyword, setKeyword] = useState('');
  const [vulnerabilityType, setVulnerabilityType] = useState('');

  // Date range options 
  const dateOptions = [
    { label: 'Past Hour', value: 'hour' },
    { label: 'Past 24 Hours', value: 'day' },
    { label: 'Past Week', value: 'week' },
    { label: 'Past Month', value: 'month' },
    { label: 'Past Year', value: 'year' },
    { label: 'All Time', value: 'all' }
  ];

  // Handle Apply button click
  const handleApply = () => {
    const filters = {
      cveId: cveId.trim(),
      severityMin: severityRange[0],
      severityMax: severityRange[1],
      publishedDateRange: {
        start: dateOptions[publishedDateIndex[0]].value,
        end: dateOptions[publishedDateIndex[1]].value
      },
      product: product.trim(),
      keyword: keyword.trim(),
      vulnerabilityType: vulnerabilityType.trim()
    };

    // Log filters for now (will be replaced with API call)
    console.log('Applied Filters:', filters);
    
    // Call parent function with filter data
    onApplyFilters(filters);
  };

  // Handle Clear All Filters
  const handleClearAll = () => {
    setCveId('');
    setSeverityRange([0, 10]);
    setPublishedDateIndex([0, 5]);
    setProduct('');
    setKeyword('');
    setVulnerabilityType('');
    
    console.log('Filters cleared');
  };

  // Get severity label based on score
  const getSeverityLabel = (score) => {
    if (score >= 9.0) return 'Critical';
    if (score >= 7.0) return 'High';
    if (score >= 4.0) return 'Medium';
    if (score >= 0.1) return 'Low';
    return 'None';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Filter CVEs</h3>
        </div>
        <button
          onClick={handleClearAll}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
        >
          <X className="w-4 h-4" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Filter Grid */}
      <div className="space-y-6 mb-6">
        
        {/* Row 1: CVE ID and Product */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CVE ID Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVE ID
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="e.g., CVE-2024-1234"
                value={cveId}
                onChange={(e) => setCveId(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Product/CPE Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name (CPE)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="e.g., node.js, apache, mysql"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Severity Range Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity Level (CVSS Score)
          </label>
          <div className="px-2">
            {/* Dual Range Slider */}
            <div className="relative h-2 bg-gray-200 rounded-full mt-12">
              {/* Colored range between handles */}
              <div 
                className="absolute h-2 bg-red-600 rounded-full"
                style={{
                  left: `${(severityRange[0] / 10) * 100}%`,
                  right: `${100 - (severityRange[1] / 10) * 100}%`
                }}
              />
              
              {/* Floating label for Min value */}
              <div 
                className="absolute -top-10 transform -translate-x-1/2"
                style={{ left: `${(severityRange[0] / 10) * 100}%` }}
              >
                <div className="bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
                  {severityRange[0].toFixed(1)} ({getSeverityLabel(severityRange[0])})
                  {/* Tooltip arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-700"></div>
                </div>
              </div>
              
              {/* Floating label for Max value */}
              <div 
                className="absolute -top-10 transform -translate-x-1/2"
                style={{ left: `${(severityRange[1] / 10) * 100}%` }}
              >
                <div className="bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
                  {severityRange[1].toFixed(1)} ({getSeverityLabel(severityRange[1])})
                  {/* Tooltip arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-700"></div>
                </div>
              </div>
              
              {/* Min slider */}
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={severityRange[0]}
                onChange={(e) => {
                  const newMin = parseFloat(e.target.value);
                  if (newMin <= severityRange[1]) {
                    setSeverityRange([newMin, severityRange[1]]);
                  }
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-700 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
              
              {/* Max slider */}
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={severityRange[1]}
                onChange={(e) => {
                  const newMax = parseFloat(e.target.value);
                  if (newMax >= severityRange[0]) {
                    setSeverityRange([severityRange[0], newMax]);
                  }
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-700 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
            </div>
            
            {/* Severity scale labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0.0</span>
              <span>2.5</span>
              <span>5.0</span>
              <span>7.5</span>
              <span>10.0</span>
            </div>
          </div>
        </div>

        {/* Published Date Range Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Published Date Range
          </label>
          <div className="px-2">
            {/* Dual Range Slider */}
            <div className="relative h-2 bg-gray-200 rounded-full mt-8">
              {/* Colored range between handles */}
              <div 
                className="absolute h-2 bg-blue-600 rounded-full"
                style={{
                  left: `${(publishedDateIndex[0] / 5) * 100}%`,
                  right: `${100 - (publishedDateIndex[1] / 5) * 100}%`
                }}
              />
              
              {/* Floating label for Start date */}
              <div 
                className="absolute -top-10 transform -translate-x-1/2"
                style={{ left: `${(publishedDateIndex[0] / 5) * 100}%` }}
              >
                <div className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
                  {dateOptions[publishedDateIndex[0]].label}
                  {/* Tooltip arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-700"></div>
                </div>
              </div>
              
              {/* Floating label for End date */}
              <div 
                className="absolute -top-10 transform -translate-x-1/2"
                style={{ left: `${(publishedDateIndex[1] / 5) * 100}%` }}
              >
                <div className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
                  {dateOptions[publishedDateIndex[1]].label}
                  {/* Tooltip arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-700"></div>
                </div>
              </div>
              
              {/* Min slider (most recent) */}
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={publishedDateIndex[0]}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  if (newMin <= publishedDateIndex[1]) {
                    setPublishedDateIndex([newMin, publishedDateIndex[1]]);
                  }
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-700 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
              
              {/* Max slider (oldest) */}
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={publishedDateIndex[1]}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  if (newMax >= publishedDateIndex[0]) {
                    setPublishedDateIndex([publishedDateIndex[0], newMax]);
                  }
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-700 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
            </div>
            
            {/* Date range labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {dateOptions.map((option, idx) => (
                <span key={idx} className={idx % 2 === 1 ? 'hidden md:inline' : ''}>
                  {option.label.split(' ')[1] || option.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Keyword and Vulnerability Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Keyword Search in Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword in Description
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="e.g., remote code execution"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Vulnerability Type (CWE) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vulnerability Type (CWE)
            </label>
            <select
              value={vulnerabilityType}
              onChange={(e) => setVulnerabilityType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
            >
            <option value="">All Types</option>
            <option value="CWE-79">XSS - Cross-Site Scripting (CWE-79)</option>
            <option value="CWE-787">Out-of-bounds Write (CWE-787)</option>
            <option value="CWE-89">SQL Injection (CWE-89)</option>
            <option value="CWE-352">CSRF - Cross-Site Request Forgery (CWE-352)</option>
            <option value="CWE-22">Path Traversal (CWE-22)</option>
            <option value="CWE-125">Out-of-bounds Read (CWE-125)</option>
            <option value="CWE-78">OS Command Injection (CWE-78)</option>
            <option value="CWE-416">Use After Free (CWE-416)</option>
            <option value="CWE-862">Missing Authorization (CWE-862)</option>
            <option value="CWE-434">Unrestricted File Upload (CWE-434)</option>
            <option value="CWE-94">Code Injection (CWE-94)</option>
            <option value="CWE-20">Improper Input Validation (CWE-20)</option>
            <option value="CWE-77">Command Injection (CWE-77)</option>
            <option value="CWE-287">Improper Authentication (CWE-287)</option>
            <option value="CWE-269">Improper Privilege Management (CWE-269)</option>
            <option value="CWE-502">Deserialization of Untrusted Data (CWE-502)</option>
            <option value="CWE-200">Information Exposure (CWE-200)</option>
            <option value="CWE-863">Incorrect Authorization (CWE-863)</option>
            <option value="CWE-918">SSRF - Server-Side Request Forgery (CWE-918)</option>
            <option value="CWE-119">Buffer Overflow / Improper Restriction (CWE-119)</option>
            <option value="CWE-476">NULL Pointer Dereference (CWE-476)</option>
            <option value="CWE-798">Use of Hard-coded Credentials (CWE-798)</option>
            <option value="CWE-190">Integer Overflow or Wraparound (CWE-190)</option>
            <option value="CWE-400">Uncontrolled Resource Consumption (CWE-400)</option>
            <option value="CWE-306">Missing Authentication for Critical Function (CWE-306)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Apply Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleClearAll}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

export default FilterPanel;