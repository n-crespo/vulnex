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
// Imports for saving history
import { useUserDataContext } from "../context/UserDataContext";
import { useAuthContext } from "../context/AuthContext";

function AnalyzeView() {
  const {
    analysisResult,
    analysisError,
    dependencies,
    analyzeFile,
    clearAnalysis,
  } = useFileAnalysis();

  // Hooks to access User Data logic
  const { saveUploadResult, isBookmarked, addBookmark, removeBookmark } =
    useUserDataContext();
  const { userLoginSessionToken, setDoAuthModel } = useAuthContext();

  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);

  // toggle add/remove bookmark
  const handleBookmarkAction = (cveId) => {
    // if user isn't logged in, ask them to
    if (!userLoginSessionToken) return setDoAuthModel(true);

    isBookmarked(cveId) ? removeBookmark(cveId) : addBookmark(cveId);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) analyzeFile(file);
  };

  // bulk scan logic
  const handleScan = async () => {
    if (dependencies.length === 0) return;
    setScanning(true);
    setScanResults([]);

    try {
      // we send the entire list of dependencies to the backend at once
      const payload = {
        dependencies: dependencies.map((dep) => ({
          name: dep.name,
          version: dep.version,
        })),
      };

      // make sure you create this route in your backend!
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.BULK_SCAN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Bulk scan failed");
      }

      const results = await response.json();

      // filter out results that have NO cves (optional, keeps UI clean)
      // or keep them if you want to show "Safe" packages
      const vulnerablePackages = results.filter(
        (r) => r.cves && r.cves.length > 0,
      );

      setScanResults(vulnerablePackages);

      // Save to History if user is logged in & vulnerabilities found
      if (userLoginSessionToken && vulnerablePackages.length > 0) {
        // Extract all CVE IDs from the packages into a flat array
        const allCveIds = vulnerablePackages.flatMap((pkg) =>
          pkg.cves.map((cve) => cve.cveId || cve.id),
        );

        // Remove duplicates
        const uniqueIds = [...new Set(allCveIds)];

        // Send to backend
        const filename = analysisResult.name || "package.json";
        saveUploadResult(filename, uniqueIds);
        console.log("Saved scan results to profile history.");
      }
    } catch (err) {
      console.error("Bulk scan error:", err);
      // Optional: Add a UI error state here
    } finally {
      setScanning(false);
    }
  };

  const handleDismiss = (packageIndex, cveIdToRemove) => {
    setScanResults((prevResults) => {
      const newResults = [...prevResults];
      const targetPackage = { ...newResults[packageIndex] };
      targetPackage.cves = targetPackage.cves.filter(
        (cve) => cve.cveId !== cveIdToRemove && cve.id !== cveIdToRemove,
      );
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

        {/* ... UPLOAD SECTION (Unchanged) ... */}
        {!analysisResult ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${analysisError ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-red-300"}`}
          >
            <Upload
              className={`w-16 h-16 mx-auto mb-4 ${analysisError ? "text-red-400" : "text-gray-400"}`}
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload package.json / lock
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
          /* ... RESULTS SECTION (Unchanged) ... */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
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
                <Trash2 size={16} /> Remove
              </button>
            </div>

            {!scanResults && !scanning && (
              <div className="text-center py-8">
                <button
                  onClick={handleScan}
                  className="bg-red-700 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors shadow-sm flex items-center gap-2 mx-auto"
                >
                  <ShieldAlert size={20} /> Scan Dependencies
                </button>
              </div>
            )}

            {scanning && (
              <div className="text-center py-12 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-red-700 mx-auto" />
                <p className="text-gray-600 font-medium">
                  Scanning {dependencies.length} packages...
                </p>
              </div>
            )}

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
                      No known vulnerabilities found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {scanResults.map((result, idx) => (
                      <div key={idx} className="relative">
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
                        <div className="space-y-4 pl-4 border-l-2 border-gray-100 ml-4">
                          {result.cves.map((cve) => (
                            <div
                              key={cve.id || cve.cveId}
                              className="relative group"
                            >
                              <CVECard
                                cve={cve}
                                isBookmarked={isBookmarked(cve.cveId)}
                                onBookmarkAction={() =>
                                  handleBookmarkAction(cve.cveId)
                                }
                              />
                              <button
                                title="Dismiss"
                                onClick={() =>
                                  handleDismiss(idx, cve.id || cve.cveId)
                                }
                                className={`text-gray-400 absolute bottom-4 right-4 p-2 rounded-full transition-colors z-10 hover:bg-red-100 hover:text-red-800`}
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
