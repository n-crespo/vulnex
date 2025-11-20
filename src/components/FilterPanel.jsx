// src/components/FilterPanel.jsx

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

// FilterPanel component - handles all CVE filtering options
function FilterPanel({ onApplyFilters }) {
  // Individual filter states
  const [cveId, setCveId] = useState('');
  const [severityRange, setSeverityRange] = useState('all');
  const [publishedDate, setPublishedDate] = useState('all');
  const [product, setProduct] = useState('');
  const [keyword, setKeyword] = useState('');
  const [vulnerabilityType, setVulnerabilityType] = useState('');

  // Handle Apply button click
  const handleApply = () => {
    const filters = {
      cveId: cveId.trim(),
      severityRange,
      publishedDate,
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
    setSeverityRange('all');
    setPublishedDate('all');
    setProduct('');
    setKeyword('');
    setVulnerabilityType('');
    
    console.log('Filters cleared');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Filter CVEs</h3>
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
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

        {/* Severity Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity Level
          </label>
          <select
            value={severityRange}
            onChange={(e) => setSeverityRange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (9.0 - 10.0)</option>
            <option value="high">High (7.0 - 8.9)</option>
            <option value="medium">Medium (4.0 - 6.9)</option>
            <option value="low">Low (0.1 - 3.9)</option>
          </select>
        </div>

        {/* Published Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Published Date
          </label>
          <select
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
          >
            <option value="all">All Time</option>
            <option value="hour">Past Hour</option>
            <option value="day">Past 24 Hours</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
          </select>
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