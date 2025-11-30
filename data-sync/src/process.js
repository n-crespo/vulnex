import { extractCveData } from "./extract.js";
import { logBadCve } from "./output.js";

/**
 * Processes a batch of raw NVD vulnerabilities.
 * @param {Array<object>} vulnerabilities - Array of raw CVE records.
 */
export async function processCveBatch(vulnerabilities, metrics, BAD_CVES_FILE) {
  const goodCves = [];
  let batchRejectedCount = 0;
  let batchFailedCount = 0;

  // Capture current global partial failure counts before processing the batch
  const initialUnknownSeverity = metrics.totalUnknownSeverity;
  const initialUnknownProductName = metrics.totalUnknownProductName;
  const initialUnknownProductVersion = metrics.totalUnknownProductVersion;
  const initialFailedProductName = metrics.initialFailedProductName;

  const batchProcessed = vulnerabilities.length;
  metrics.totalProcessed += batchProcessed;
  // Update global processed count at the start of the batch

  for (const vuln of vulnerabilities) {
    try {
      const extractedRecord = extractCveData(vuln, metrics);
      if (extractedRecord) {
        goodCves.push(extractedRecord);
      }
      metrics.totalSuccessful++;
    } catch (error) {
      if (error.isRejected) {
        batchRejectedCount++;
        metrics.totalRejected++;
      } else {
        batchFailedCount++;
        metrics.totalFailed++;
        console.error(
          `[BAD CVE] ${error.message}. Logging to ${BAD_CVES_FILE}`,
        );
        // Use the raw cve object for logging the failure
        await logBadCve(vuln.cve, error.message, BAD_CVES_FILE);
      }
    }
  }

  // Calculate batch partial failure increments
  return [
    goodCves,
    {
      batchProcessed: batchProcessed,
      batchRejectedCount: batchRejectedCount,
      batchFailedCount: batchFailedCount,
      batchSuccessCount: goodCves.length,
      batchFailedProductName:
        metrics.totalUnknownProductName - initialFailedProductName,
      batchUnknownSeverity:
        metrics.totalUnknownSeverity - initialUnknownSeverity,
      batchUnknownProduct:
        metrics.totalUnknownProduct - initialUnknownProductName,
      batchUnknownProductVersion:
        metrics.totalUnknownProductVersion - initialUnknownProductVersion,
    },
  ];
}
