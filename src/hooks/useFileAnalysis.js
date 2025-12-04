import { useState } from "react";

export function useFileAnalysis() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // process the uploaded file
  const analyzeFile = (file) => {
    if (!file) return;

    setAnalysisError(null);
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      try {
        const jsonParsedResult = JSON.parse(e.target.result);
        setAnalysisResult(jsonParsedResult);
      } catch (err) {
        console.error("JSON Parse Error:", err);
        setAnalysisError(
          "Invalid JSON format detected. Please upload a valid package.json.",
        );
        setAnalysisResult(null);
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
  };

  return {
    analysisResult,
    analysisError,
    analyzeFile,
    clearAnalysis,
  };
}
