import { useState, memo } from "react";
import {
  Upload,
  FileJson,
  Trash2,
  ShieldAlert,
  CheckCircle,
  Loader2,
  Package,
  X,
} from "lucide-react";
import { useFileAnalysis } from "../hooks/useFileAnalysis";
import CVECard from "./CVECard";
import { API_BASE_URL, ENDPOINTS } from "../constants/api";

function AnalyzeView() {
  const {
    analysisResult,
    analysisError,
    dependencies,
    analyzeFile,
    clearAnalysis,
  } = useFileAnalysis();

  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) analyzeFile(file);
  };

  const handleScan = async () => {
    if (dependencies.length === 0) return;
    setScanning(true);
    setScanResults([]);

    const results = [];

    for (const dep of dependencies) {
      try {
        const params = new URLSearchParams({
          productName: dep.name,
          version: dep.version,
          limit: "10",
        });

        // Updated to use your ENDPOINTS constant
        const response = await fetch(
          `${API_BASE_URL}${ENDPOINTS.CVES}?${params}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            results.push({
              package: dep.name,
              version: dep.version,
              cves: data,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to scan ${dep.name}`, err);
      }
    }

    setScanResults(results);
    setScanning(false);
  };

  // Logic to remove a specific CVE from the list
  const handleDismiss = (packageIndex, cveIdToRemove) => {
    setScanResults((prevResults) => {
      // Create a shallow copy of the array
      const newResults = [...prevResults];
      // Create a shallow copy of the specific package object
      const targetPackage = { ...newResults[packageIndex] };
      // Filter out the dismissed CVE
      targetPackage.cves = targetPackage.cves.filter(
        (cve) => cve.cveId !== cveIdToRemove && cve.id !== cveIdToRemove,
      );

      // Update the array
      newResults[packageIndex] = targetPackage;
      return newResults;
    });
  };

  const handleClear = () => {
    clearAnalysis();
    setScanResults(null);
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Analyze Your Project
        </h2>

        {!analysisResult ? (
          /* --- UPLOAD SECTION (Unchanged) --- */
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              analysisError
                ? "border-red-300 bg-red-50"
                : "border-gray-300 hover:border-red-300"
            }`}
          >
            <Upload
              className={`w-16 h-16 mx-auto mb-4 ${analysisError ? "text-red-400" : "text-gray-400"}`}
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload package.json
            </h3>
            {analysisError ? (
              <p className="text-red-600 mb-4 font-semibold">{analysisError}</p>
            ) : (
              <p className="text-gray-600 mb-4">
                Drag and drop or click to choose file
              </p>
            )}
            <label className="inline-block">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                onClick={(e) => {
                  e.target.value = null;
                }}
                className="hidden"
              />
              <span className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors cursor-pointer inline-block font-medium">
                Choose File
              </span>
            </label>
          </div>
        ) : (
          /* --- RESULTS SECTION --- */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* 1. File Summary Header */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <FileJson className="text-gray-600" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {analysisResult.name || "package.json"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {dependencies.length} dependencies detected
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>

            {/* 2. Scan Button */}
            {!scanResults && !scanning && (
              <div className="text-center py-8">
                <button
                  onClick={handleScan}
                  className="bg-red-700 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors shadow-sm flex items-center gap-2 mx-auto"
                >
                  <ShieldAlert size={20} />
                  Scan Dependencies for CVEs
                </button>
              </div>
            )}

            {/* 3. Loading Spinner */}
            {scanning && (
              <div className="text-center py-12 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-red-700 mx-auto" />
                <p className="text-gray-600 font-medium">
                  Scanning {dependencies.length} packages against vulnerability
                  database...
                </p>
              </div>
            )}

            {/* 4. Scan Results List */}
            {scanResults && (
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Scan Results
                  </h3>
                  <span className="text-sm font-medium text-gray-500">
                    Found issues in{" "}
                    <span className="text-red-700 font-bold">
                      {scanResults.length}
                    </span>{" "}
                    packages
                  </span>
                </div>

                {scanResults.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center text-green-800">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                    <h4 className="text-lg font-bold">Safe & Sound</h4>
                    <p className="text-green-700">
                      No known vulnerabilities found in your dependencies.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {scanResults.map((result, idx) => (
                      <div key={idx} className="relative">
                        {/* GROUP HEADER */}
                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white/95 backdrop-blur z-10 py-2 border-b border-gray-100">
                          <div className="p-2 bg-red-50 rounded-lg text-red-700">
                            <Package size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              {result.package}
                              <span className="text-sm font-normal text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full border border-gray-200">
                                v{result.version}
                              </span>
                            </h4>
                          </div>
                          <div className="ml-auto">
                            <span className="text-xs font-bold bg-red-100 text-red-800 px-3 py-1 rounded-full border border-red-200">
                              {result.cves.length} CVEs Found
                            </span>
                          </div>
                        </div>

                        {/* CARD GRID */}
                        <div className="space-y-4 pl-4 border-l-2 border-gray-100 ml-4">
                          {result.cves.length === 0 && (
                            <p className="text-sm text-gray-400 italic">
                              All CVEs dismissed for this package.
                            </p>
                          )}

                          {result.cves.map((cve) => (
                            /* WRAPPER DIV for positioning the X button */
                            <div
                              key={cve.id || cve.cveId}
                              className="relative group"
                            >
                              <CVECard cve={cve} />

                              {/* DISMISS BUTTON */}
                              <button
                                onClick={() =>
                                  handleDismiss(idx, cve.id || cve.cveId)
                                }
                                className="absolute top-4 right-4 p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20"
                                title="Dismiss this CVE as irrelevant"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AnalyzeView);
