import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import { logBadCve, writeBatchToOutput, postToDatabase } from "./src/output.js";
import {
  extractRequiredFields,
  extractStatus,
  extractIsVulnerable,
  extractSeverityLevel,
  extractProductDetails,
} from "./src/extract.js";
import { verifyCveArrayData } from "./src/verify.js";
import { generateFinalReport, generateBatchReport } from "./src/report.js";

const NVD_API_KEY = process.env.NVD_API_KEY;
// const API_SECRET_KEY = process.env.API_SECRET_KEY;
const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
// const API_BASE_URL = "http://localhost:3000/api/cves";

const RESULTS_PER_PAGE = 2000;
const BAD_CVES_FILE = "badCVEs.jsonl";
const OUTPUT_FILE = "output.jsonl";
// const API_RATE_LIMIT_MS = 0;
const MAX_CONCURRENT_FETCHES = 10;
const MAX_RETRIES = 6; // increased from 5

// global counters used in final report
const metrics = {
  totalResults: 0,
  totalSuccessful: 0,
  totalRejected: 0,
  totalFailed: 0,
  totalProcessed: 0,
  // extraction errors
  totalMissingStatus: 0,
  totalUnknownVulnerability: 0,
  totalUnknownSeverity: 0,
  totalUnknownProduct: 0,
  totalValidationFails: 0,
};

let outputStream = null;

// don't run without api key
// if (!API_SECRET_KEY) {
//   console.warn("Warning: API_SECRET_KEY is not set. Execution stopped.");
//   throw new Error("API_SECRET_KEY is required.");
// }

/**
 * Extracts and validates all required fields from a single NVD vulnerability record.
 * @param {object} vulnerability - A single item from the NVD 'vulnerabilities' array.
 * @returns {object} The standardized and validated CVE record.
 */
const extractCveData = (vulnerability) => {
  const cve = vulnerability.cve;

  // Check for "Rejected" status first and discard
  if (cve?.vulnStatus === "Rejected") {
    const rejectedError = new Error(`Rejected CVE ID: ${cve.id}`);
    rejectedError.isRejected = true;
    throw rejectedError;
  }

  // extract mandatory fields and throw error if fails (shouldn't, hasn't)
  const requiredData = extractRequiredFields(cve);

  // optional fields (include failure counters, errors gracefully)
  const finalStatus = extractStatus(cve, metrics);
  const isVulnerableString = extractIsVulnerable(cve, metrics);
  const severityLevel = extractSeverityLevel(cve.metrics, metrics);
  const productDetails = extractProductDetails(cve, metrics); // returns object with 4 fields

  const record = {
    cveId: requiredData.id,
    published: requiredData.published,
    lastModified: requiredData.lastModified,
    description: requiredData.description,
    status: finalStatus,
    isVulnerable: isVulnerableString,
    severityLevel: severityLevel,
    productName: productDetails.productName,
    patchedInVersion: productDetails.patchedInVersion,
    minAffectedVersion: productDetails.minAffectedVersion,
    maxAffectedVersion: productDetails.maxAffectedVersion,
  };

  return record;
};

/**
 * Main function to fetch CVEs from the NVD API using rate-limited concurrency.
 */
async function fetchAllCVEs() {
  console.log("Starting initial fetch to determine total results...");

  // synchronous fetch to get totalResults
  const initialUrl = `${NVD_BASE_URL}/?resultsPerPage=1&startIndex=0`;
  let totalResults = 0;
  try {
    const response = await fetch(initialUrl, {
      headers: { apiKey: NVD_API_KEY, Accept: "application/json" },
    });
    const rawData = await response.json();
    totalResults = rawData.totalResults;
    metrics.totalResults = totalResults;
    console.log(`Total CVEs found: ${totalResults}`);
  } catch (error) {
    console.error(`CRITICAL: Initial API fetch failed: ${error.message}`);
    return;
  }

  await fs.writeFile(BAD_CVES_FILE, "", "utf-8"); // clear bad CVEs log file on start
  outputStream = createWriteStream(OUTPUT_FILE, { encoding: "utf8" });

  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const startIndices = [];
  for (let i = 0; i < totalPages; i++) {
    startIndices.push(i * RESULTS_PER_PAGE);
  }

  const promises = [];
  let activeFetches = 0;

  console.log(
    `Starting concurrent fetch of ${totalPages} batches (Max Concurrency: ${MAX_CONCURRENT_FETCHES}).`,
  );

  // simple rate-limited concurrent execution
  const runInParallel = async () => {
    for (let i = 0; i < startIndices.length; i++) {
      const startIndex = startIndices[i];

      // wait until the number of active fetches is below the limit
      while (activeFetches >= MAX_CONCURRENT_FETCHES) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // short pause to wait for a slot
      }

      activeFetches++;

      // start the fetch/process, but don't await it immediately
      const promise = fetchAndProcessBatch(startIndex, totalResults).finally(
        () => {
          activeFetches--; // decrement active count when done
        },
      );
      promises.push(promise);

      // No explicit global API rate limit timeout
    }

    // Wait for all started promises to resolve
    await Promise.all(promises);
  };

  try {
    await runInParallel();
  } catch (e) {
    console.error("An error occurred during concurrent execution:", e.message);
  } finally {
    // Ensure the stream is closed after all work is done
    outputStream.end();
  }

  // final report
  generateFinalReport(metrics);
}

/**
 * Executes a single NVD API fetch, handles retry logic, and processes the batch.
 * @param {number} currentStartIndex - The starting index for this fetch.
 * @param {number} totalResults - The total number of results reported by the API (for progress calculation).
 */
async function fetchAndProcessBatch(currentStartIndex, totalResults) {
  const NVD_API_URL = `${NVD_BASE_URL}/?resultsPerPage=${RESULTS_PER_PAGE}&startIndex=${currentStartIndex}`;

  const requestOptions = {
    method: "GET",
    headers: {
      apiKey: NVD_API_KEY,
      Accept: "application/json",
    },
  };

  let maxRetries = MAX_RETRIES;
  let delay = 2000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(NVD_API_URL, requestOptions);

      if (response.status === 429) {
        console.warn(
          `Attempt ${attempt + 1}/${maxRetries}: Rate limit exceeded (429) for index ${currentStartIndex}. Retrying in ${delay / 1000}s...`,
        );
        if (attempt === maxRetries - 1) {
          throw new Error(
            "Maximum retries reached for rate limiting. Aborting.",
          );
        }

        // JITTER (include randomness in delay for next api call to avoid overloading api)
        const minDelay = delay / 2;
        const jitterDelay =
          Math.floor(Math.random() * (delay - minDelay + 1)) + minDelay;

        await new Promise((resolve) => setTimeout(resolve, jitterDelay));

        delay = Math.min(delay * 2, 60000);
        continue; // Go to the next attempt
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status} for index ${currentStartIndex}. Body: ${errorBody.substring(0, 100)}...`,
        );
      }

      const rawData = await response.json();

      console.log(
        `\n--- Processing Batch starting at Index: ${currentStartIndex} ---`,
      );
      console.log(
        `Progress: ${((currentStartIndex / totalResults) * 100).toFixed(2)}% (${currentStartIndex}/${totalResults})`,
      );

      await processCveBatch(rawData.vulnerabilities);

      return rawData.vulnerabilities.length;
    } catch (error) {
      console.error(
        `\nCRITICAL API/Fetch Error for index ${currentStartIndex}: ${error.message}`,
      );
      return 0;
    }
  }
  return 0;
}

/**
 * Processes a batch of raw NVD vulnerabilities.
 * @param {Array<object>} vulnerabilities - Array of raw CVE records.
 */
async function processCveBatch(vulnerabilities) {
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
      const extractedRecord = extractCveData(vuln);
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
  const batchMetrics = {
    batchProcessed: batchProcessed,
    batchRejectedCount: batchRejectedCount,
    batchFailedCount: batchFailedCount,
    batchSuccessCount: goodCves.length,
    batchMissingStatus: metrics.totalMissingStatus - initialMissingStatus,
    batchUnknownVulnerable:
      metrics.totalUnknownVulnerability - initialUnknownVulnerable,
    batchUnknownSeverity: metrics.totalUnknownSeverity - initialUnknownSeverity,
    batchUnknownProduct: metrics.totalUnknownProduct - initialUnknownProduct,
  };

  if (goodCves.length > 0 && verifyCveArrayData(goodCves)) {
    // write to output file
    await writeBatchToOutput(goodCves);
    // post to database
    await postToDatabase(goodCves);
  }

  // log per-batch report
  generateBatchReport(metrics, batchMetrics);
}

// const protectedClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: { "x-api-key": API_SECRET_KEY, "Content-Type": "application/json" },
// });

fetchAllCVEs();
