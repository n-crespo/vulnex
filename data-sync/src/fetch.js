import { extractCveData } from "./extract.js";

/**
 * Processes a batch of raw NVD vulnerabilities.
 * @param {Array<object>} vulnerabilities - Array of raw CVE records.
 */
export async function processCveBatch(vulnerabilities, metrics, BAD_CVES_FILE) {
  const goodCves = [];
  let batchRejectedCount = 0;
  let batchFailedCount = 0;

  // Capture current global partial failure counts before processing the batch
  const initialMissingStatus = metrics.totalMissingStatus;
  const initialUnknownVulnerable = metrics.totalUnknownVulnerability;
  const initialUnknownSeverity = metrics.totalUnknownSeverity;
  const initialUnknownProduct = metrics.totalUnknownProduct;

  const batchProcessed = vulnerabilities.length;
  metrics.totalProcessed += batchProcessed;
  // Update global processed count at the start of the batch

  for (const vuln of vulnerabilities) {
    try {
      const extractedRecord = extractCveData(vuln, metrics);
      goodCves.push(extractedRecord);
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
      batchMissingStatus: metrics.totalMissingStatus - initialMissingStatus,
      batchUnknownVulnerable:
        metrics.totalUnknownVulnerability - initialUnknownVulnerable,
      batchUnknownSeverity:
        metrics.totalUnknownSeverity - initialUnknownSeverity,
      batchUnknownProduct: metrics.totalUnknownProduct - initialUnknownProduct,
    },
  ];
}
