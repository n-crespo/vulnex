import { Upload, FileJson, Trash2 } from "lucide-react";
import { useFileAnalysis } from "../hooks/useFileAnalysis";
import { memo } from "react";

/**
 * Renders the file upload and dependency analysis interface.
 * Uses useFileAnalysis hook to abstract file reading logic.
 */
function AnalyzeView() {
  const { analysisResult, analysisError, analyzeFile, clearAnalysis } =
    useFileAnalysis();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      analyzeFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Container - Standardized to match FilterPanel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Analyze Your Project
        </h2>

        {/* Upload Area */}
        {!analysisResult ? (
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
              {/* Standardized Button Color (red-700) */}
              <span className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors cursor-pointer inline-block font-medium">
                Choose File
              </span>
            </label>
          </div>
        ) : (
          /* Results Area */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-green-700">
                <FileJson size={24} />
                <span className="font-semibold">File Loaded Successfully</span>
              </div>
              <button
                onClick={clearAnalysis}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                <Trash2 size={16} />
                Clear & Upload New
              </button>
            </div>

            <pre className="text-left bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm max-h-[50vh] border border-gray-700 shadow-inner">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AnalyzeView);
