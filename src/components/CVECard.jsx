// CVE Vulnerability Card Component 
function CVECard({ cve }) {
  
  // Severity Color
  const getSeverityColor = (severity) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800 border-red-300',
      High: 'bg-orange-100 text-orange-800 border-orange-300',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[severity] || colors.Medium;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* CVE Header: ID, Severity, and CVSS Score */}
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{cve.id}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(cve.severity)}`}>
              {cve.severity}
            </span>
            <span className="text-sm text-gray-500">CVSS {cve.score}</span>
          </div>
          
          {/* CVE Title */}
          <h4 className="text-md font-medium text-gray-800 mb-2">{cve.title}</h4>
          
          {/* CVE Description */}
          <p className="text-gray-600 mb-3">{cve.description}</p>
          
          {/* CVE Package, Version, Published Date */}
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-700">
              <span className="font-medium">Package:</span> {cve.package}
            </span>
            <span className="text-gray-700">
              <span className="font-medium">Affected:</span> {cve.version}
            </span>
            <span className="text-gray-500">
              Published: {cve.published}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CVECard;