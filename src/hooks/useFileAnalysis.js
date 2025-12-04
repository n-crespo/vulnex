import { useState } from "react";

/**
 * Hook to handle file upload, parsing, and dependency extraction.
 */
export function useFileAnalysis() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [dependencies, setDependencies] = useState([]);

  // process the uploaded file
  const analyzeFile = (file) => {
    if (!file) return;

    setAnalysisError(null);
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setAnalysisResult(json);

        // combine prod and dev dependencies
        const rawDeps = {
          ...(json.dependencies || {}),
          ...(json.devDependencies || {}),
        };

        // transform into array and clean version numbers (remove ^, ~, etc)
        const parsedDeps = Object.entries(rawDeps).map(([name, version]) => ({
          name,
          version: version.replace(/^[\^~>=<]/, ""), // simple semver cleaning
        }));

        setDependencies(parsedDeps);
      } catch (err) {
        console.error("JSON Parse Error:", err);
        setAnalysisError(
          "Invalid JSON format detected. Please upload a valid package.json.",
        );
        setAnalysisResult(null);
        setDependencies([]);
      }
    };

    fileReader.onerror = () => {
      setAnalysisError("Error reading the file.");
    };

    fileReader.readAsText(file);
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setDependencies([]);
  };

  return {
    analysisResult,
    analysisError,
    dependencies,
    analyzeFile,
    clearAnalysis,
  };
}
