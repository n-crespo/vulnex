import { extractCveData } from "./extract.js";
import { logBadCve } from "./output.js";

/**
 * Processes a batch of raw NVD vulnerabilities.
 * @param {Array<object>} vulnerabilities - Array of raw CVE records.
 */
export async function processCveBatch(vulnerabilities, metrics, BAD_CVES_FILE) {
  const goodCves = [];

  metrics.totalProcessed += vulnerabilities.length;
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
        metrics.totalRejected++;
      } else {
        metrics.totalFailed++;
        console.error(
          `[BAD CVE] ${error.message}. Logging to ${BAD_CVES_FILE}`,
        );
        // Use the raw cve object for logging the failure
        await logBadCve(vuln.cve, error.message, BAD_CVES_FILE);
      }
    }
  }

  return goodCves;
}
