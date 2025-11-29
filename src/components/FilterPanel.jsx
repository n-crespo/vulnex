// src/components/FilterPanel.jsx

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

// FilterPanel component - handles all CVE filtering options
function FilterPanel({ onApplyFilters }) {
  // Individual filter states
  const [cveId, setCveId] = useState('');
  const [severityRange, setSeverityRange] = useState([0, 10]); // [min, max]
  const [publishedDateOption, setPublishedDateOption] = useState('all'); // Dropdown selection
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dateError, setDateError] = useState(''); // Error message for invalid date range
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
    { label: 'All Time', value: 'all' },
    { label: 'Custom Range', value: 'custom' }
  ];

  // Handle Apply button click
  const handleApply = () => {
    // Validate custom date range
    if (publishedDateOption === 'custom') {
      if (!customStartDate || !customEndDate) {
        setDateError('Please select both start and end dates');
        return;
      }
      if (new Date(customEndDate) < new Date(customStartDate)) {
        setDateError('End date cannot be before start date');
        return;
      }
      setDateError(''); // Clear error if valid
    }

    const filters = {
      cveId: cveId.trim(),
      severityMin: severityRange[0] === '' ? 0 : severityRange[0], // Ensure we send numbers
      severityMax: severityRange[1] === '' ? 10 : severityRange[1],
      publishedDate: publishedDateOption === 'custom' 
        ? { type: 'custom', startDate: customStartDate, endDate: customEndDate }
        : { type: 'preset', value: publishedDateOption },
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
    setPublishedDateOption('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setDateError('');
    setProduct('');
    setKeyword('');
    setVulnerabilityType('');
    console.log('Filters cleared');
  };

  // Get severity label based on score
  const getSeverityLabel = (score) => {
    if (score === '') return 'None'; // Handle empty string case
    if (score >= 9) return 'Critical';
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    if (score >= 1) return 'Low'; // Integer check
    return 'None';
  };

  // Handle manual severity input with validation
  const handleSeverityInput = (value, isMin) => {
    // Allow empty string for user to clear input
    if (value === '') {
      if (isMin) {
        setSeverityRange(['', severityRange[1]]);
      } else {
        setSeverityRange([severityRange[0], '']);
      }
      return;
    }
    
    // CHANGED: Use parseInt for integers only
    const numValue = parseInt(value, 10);
    
    // Validate: must be a number, between 0-10
    if (isNaN(numValue) || numValue < 0 || numValue > 10) {
      return; // Don't update if invalid
    }
    
    if (isMin) {
      // Update min, but ensure it doesn't exceed max (if max is set)
      const maxVal = severityRange[1] === '' ? 10 : severityRange[1];
      if (numValue <= maxVal) {
        setSeverityRange([numValue, severityRange[1]]);
      }
    } else {
      // Update max, but ensure it's not less than min (if min is set)
      const minVal = severityRange[0] === '' ? 0 : severityRange[0];
      if (numValue >= minVal) {
        setSeverityRange([severityRange[0], numValue]);
      }
    }
  };

  // To prevent crashing when deleting numbers in severity inputs
  const safeMin = severityRange[0] === '' ? 0 : severityRange[0];
  const safeMax = severityRange[1] === '' ? 10 : severityRange[1];

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
          
          {/* Manual input boxes */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Score</label>
              <input
                type="number"
                min="0"
                max="10"
                step="1" 
                value={severityRange[0]}
                onChange={(e) => handleSeverityInput(e.target.value, true)}
                onBlur={() => {
                  if (severityRange[0] === '') {
                    setSeverityRange([0, severityRange[1]]);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Score</label>
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                value={severityRange[1]}
                onChange={(e) => handleSeverityInput(e.target.value, false)}
                onBlur={() => {
                  if (severityRange[1] === '') {
                    setSeverityRange([severityRange[0], 10]);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="px-2">
            {/* Dual Range Slider */}
            <div className="relative h-2 bg-gray-200 rounded-full mt-12">
              {/* Colored range between handles - USES safeMin/safeMax */}
              <div 
                className="absolute h-2 bg-red-600 rounded-full"
                style={{
                  left: `${(safeMin / 10) * 100}%`,
                  right: `${100 - (safeMax / 10) * 100}%`
                }}
              />
              
              {/* Floating label for Min value - USES safeMin */}
              <div 
                className="absolute -top-10 transform -translate-x-1/2"
                style={{ left: `${(safeMin / 10) * 100}%` }}
              >
                <div className="bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
                  {/* Safely call toFixed(0) for Integers */}
                  {safeMin.toFixed(0)} ({getSeverityLabel(safeMin)})
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-700"></div>
                </div>
              </div>
              
              {/* Floating label for Max value - USES safeMax */}
              <div 
                className="absolute -top-10 transform -translate-x-1/2"
                style={{ left: `${(safeMax / 10) * 100}%` }}
              >
                <div className="bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg">
                  {/* Safely call toFixed(0) for Integers */}
                  {safeMax.toFixed(0)} ({getSeverityLabel(safeMax)})
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-700"></div>
                </div>
              </div>
              
              {/* Min slider - USES safeMin for value, but updates state directly */}
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={safeMin}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value, 10);
                  // Compare against safeMax to prevent crossover bugs
                  if (newMin <= safeMax) {
                    setSeverityRange([newMin, severityRange[1]]);
                  }
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-700 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
              
              {/* Max slider - USES safeMax for value */}
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={safeMax}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value, 10);
                  // Compare against safeMin
                  if (newMax >= safeMin) {
                    setSeverityRange([severityRange[0], newMax]);
                  }
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-700 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
            </div>
            
            {/* Severity scale labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Published Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Published Date
          </label>
          
          {/* Dropdown for date options */}
          <select
            value={publishedDateOption}
            onChange={(e) => setPublishedDateOption(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom date range pickers - only show when "Custom Range" is selected */}
          {publishedDateOption === 'custom' && (
            <div className="mt-4">
              {dateError && (
                <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                  {dateError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      if (dateError) setDateError('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      if (dateError) setDateError('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}
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