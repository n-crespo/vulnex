import { useState } from "react";

export function useFileAnalysis() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [dependencies, setDependencies] = useState([]);

  const analyzeFile = (file) => {
    if (!file) return;

    setAnalysisError(null);
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setAnalysisResult(json);

        let parsedDeps = [];

        // package-lock.json
        if (json.lockfileVersion || file.name.endsWith("lock.json")) {
          let rawDeps = {};

          // try finding "" in packages
          if (json.packages && json.packages[""]) {
            // v3 root
            rawDeps = {
              ...(json.packages[""].dependencies || {}),
              ...(json.packages[""].devDependencies || {}),
            };
          }
          // fallback to v1 lock file
          else if (json.dependencies) {
            rawDeps = json.dependencies;
          }

          parsedDeps = Object.entries(rawDeps).map(([name, value]) => {
            let version = "";

            // v3 Root value is a string: "^1.0.0"
            if (typeof value === "string") {
              version = value;
            }
            // v1/v2 is an object: { "version": "1.0.0" }
            else if (typeof value === "object" && value !== null) {
              version = value.version || "";
            }

            return {
              name,
              // clean the version to remove ^, ~, >= so the API match works
              version: version.replace(/^[\^~>=<]+/, ""),
            };
          });
        }

        // package.json
        else {
          const rawDeps = {
            ...(json.dependencies || {}),
            ...(json.devDependencies || {}),
          };

          parsedDeps = Object.entries(rawDeps).map(([name, version]) => ({
            name,
            version: version.replace(/^[\^~>=<]+/, ""),
          }));
        }

        console.log("Extracted Dependencies:", parsedDeps); // Debug log
        setDependencies(parsedDeps);

        if (parsedDeps.length === 0) {
          setAnalysisError("No dependencies found in this file.");
        }
      } catch (err) {
        console.error("JSON Parse Error:", err);
        setAnalysisError(
          "Invalid JSON format. Please upload a valid package.json or package-lock.json.",
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
