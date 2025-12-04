import { useState } from "react";
import { Search, Filter, X, AlertCircle } from "lucide-react";
import { useCveDataContext } from "../context/CveDataContext";

function FilterPanel() {
  const { handleApplyFilters } = useCveDataContext();

  // --- States ---
  const [cveId, setCveId] = useState("");
  const [productName, setProductName] = useState("");
  const [version, setVersion] = useState("");
  const [severityLevel, setSeverityLevel] = useState("");
  const [keyword, setKeyword] = useState("");

  // Date states
  const [dateOption, setDateOption] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [versionError, setVersionError] = useState("");

  // Date Presets
  const dateOptions = [
    { label: "Any Time", value: "all" },
    { label: "Past 24 Hours", value: "day" },
    { label: "Past Week", value: "week" },
    { label: "Past Month", value: "month" },
    { label: "Custom Range", value: "custom" },
  ];

  const severityOptions = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

  // --- Handlers ---

  const handleApply = () => {
    // 1. Validation: Version requires Product
    if (version.trim() !== "" && productName.trim() === "") {
      setVersionError("Product Name is required when searching by Version");
      return;
    } else {
      setVersionError("");
    }

    // 2. Validation: Custom Date logic
    let publishedStart = null;
    let publishedEnd = null;

    if (dateOption === "custom") {
      if (!customStartDate && !customEndDate) {
        setDateError("Select at least one date for custom range");
        return;
      }
      if (
        customStartDate &&
        customEndDate &&
        new Date(customEndDate) < new Date(customStartDate)
      ) {
        setDateError("End date cannot be before start date");
        return;
      }
      publishedStart = customStartDate;
      publishedEnd = customEndDate;
      setDateError("");
    } else if (dateOption !== "all") {
      // Calculate date for presets
      const now = new Date();
      if (dateOption === "day") now.setDate(now.getDate() - 1);
      if (dateOption === "week") now.setDate(now.getDate() - 7);
      if (dateOption === "month") now.setMonth(now.getMonth() - 1);
      publishedStart = now.toISOString().split("T")[0]; // Format YYYY-MM-DD
    }

    // 3. Build Filter Object
    const filters = {
      cveId: cveId.trim(),
      productName: productName.trim(),
      version: version.trim(),
      severityLevel: severityLevel,
      keyword: keyword.trim(),
      publishedStart: publishedStart,
      publishedEnd: publishedEnd,
    };

    console.log("Applied Filters:", filters);
    handleApplyFilters(filters);
  };

  const handleClearAll = () => {
    setCveId("");
    setProductName("");
    setVersion("");
    setSeverityLevel("");
    setKeyword("");
    setDateOption("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setDateError("");
    setVersionError("");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

      <div className="space-y-6 mb-6">
        {/* Row 1: CVE ID & Severity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVE ID (Exact)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="CVE-2024-XXXX"
                value={cveId}
                onChange={(e) => setCveId(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level
            </label>
            <select
              value={severityLevel}
              onChange={(e) => setSeverityLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
            >
              <option value="">Any Severity</option>
              {severityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Product & Version */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name (Regex supported)
            </label>
            <input
              type="text"
              placeholder="e.g. Chrome, Windows"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                if (e.target.value) setVersionError("");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version
            </label>
            <input
              type="text"
              placeholder="e.g. 1.0.4"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm ${versionError ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            />
            {versionError && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {versionError}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Keyword & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search description..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Published Date
            </label>
            <select
              value={dateOption}
              onChange={(e) => setDateOption(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
            >
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {dateOption === "custom" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Start</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">End</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full p-1 border rounded text-sm"
                  />
                </div>
              </div>
            )}
            {dateError && (
              <p className="text-xs text-red-600 mt-1">{dateError}</p>
            )}
          </div>
        </div>
      </div>

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
