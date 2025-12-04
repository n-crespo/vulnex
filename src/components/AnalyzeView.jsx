import { useState } from "react";
import { Upload } from "lucide-react";

/**
 * Renders the file upload and dependency analysis interface.
 * Manages the state and logic for uploading and parsing a package.json file.
 */
export default function AnalyzeView() {
  const [jsonLocalDataUploaded, setJsonLocalDataUploaded] = useState(null);

  // a function to upload a local json file:
  const uploadJSONFile = (event) => {
    const jsonFile = event.target.files[0];
    if (!jsonFile) return;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      try {
        const jsonParsedResult = JSON.parse(fileReader.result);
        setJsonLocalDataUploaded(jsonParsedResult);
      } catch {
        console.log("Error - bad JSON upload");
        setJsonLocalDataUploaded({ error: "Invalid JSON format detected." });
      }
    };
    fileReader.readAsText(jsonFile);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Analyze Your Project
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-red-300 transition-colors">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload package.json
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your package.json file here, or click to choose file
          </p>
          <label className="inline-block">
            <input
              type="file"
              accept=".json,application/json"
              onChange={uploadJSONFile}
              // Clear file input value to allow the same file to be selected again
              onClick={(e) => {
                e.target.value = null;
              }}
              className="hidden"
            />
            <span className="px-6 py-2 bg-red-400 text-white rounded-lg hover:bg-red-800 transition-colors cursor-pointer inline-block">
              Choose File
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
        {jsonLocalDataUploaded ? (
          // display the result if something was uploaded
          <pre className="text-left bg-gray-100 p-4 rounded overflow-auto text-sm max-h-[50vh]">
            {JSON.stringify(jsonLocalDataUploaded, null, 2)}
          </pre>
        ) : (
          <p>Upload a package.json file to see vulnerability analysis</p>
        )}
      </div>
    </div>
  );
}
