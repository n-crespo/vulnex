import { promises as fs } from "fs";
import axios from "axios";

// --- Configuration ---
const NVD_API_KEY = process.env.NVD_API_KEY;
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const API_BASE_URL = "http://localhost:3000/api/cves";

const RESULTS_PER_PAGE = 2000;
const BAD_CVES_FILE = "badCVEs.jsonl";
const API_RATE_LIMIT_MS = 0; // THROTTLE REMOVED: Set to 0 to run as fast as possible
const MAX_CONCURRENT_FETCHES = 10; // Max number of simultaneous NVD API requests

// --- Global Counters for Total Reporting ---
let totalProcessed = 0;
let totalSuccessful = 0;
let totalRejected = 0;
let totalFailed = 0;

// --- Initial Checks ---
if (!API_SECRET_KEY) {
  console.warn("Warning: API_SECRET_KEY is not set. Execution stopped.");
  throw new Error("API_SECRET_KEY is required.");
}

// const protectedClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: { "x-api-key": API_SECRET_KEY, "Content-Type": "application/json" },
// });

/**
 * Helper function to append a failed CVE record to the log file.
 * NOTE: The JSON object only includes cveId and reason as requested.
 * @param {object} cveRecord - The raw CVE object that failed.
 * @param {string} reason - The reason for failure (e.g., missing field).
 */
async function logBadCve(cveRecord, reason) {
  // Only include cveId and reason as requested
  const logEntry =
    JSON.stringify({
      cveId: cveRecord.id,
      reason: reason,
    }) + "\n";
  try {
    // Append the JSONL entry to the file
    await fs.appendFile(BAD_CVES_FILE, logEntry, "utf-8");
  } catch (err) {
    console.error(`FATAL: Could not write to ${BAD_CVES_FILE}: ${err.message}`);
  }
}

async function postToDatabase(newCVEsArray) {
  if (!newCVEsArray || newCVEsArray.length === 0) {
    console.log("No new CVE records to post.");
    return;
  }
  console.log(`Attempting to post ${newCVEsArray.length} records...`);
  // --- This is the placeholder for your actual database posting logic ---
  // try {
  //   const response = await protectedClient.post("/", newCVEsArray);
  //   const status = response.status;
  //   if (status !== 200) {
  //     throw new Error(`Post to database failed with status: ${status}`);
  //   }
  //   console.log("Successfully posted batch to database.");
  // } catch (error) {
  //   console.error("Database post error: ", error.message);
  // }
}

/**
 * Extracts and validates all required fields from a single NVD vulnerability record.
 * Throws an Error if any mandatory field is missing, allowing the calling function
 * to log the bad CVE.
 * * Required fields: cveId, published, lastModified, description (English)
 * * @param {object} vulnerability - A single item from the NVD 'vulnerabilities' array.
 * @returns {object} The standardized and validated CVE record.
 */
const extractCveData = (vulnerability) => {
  const cve = vulnerability.cve;
  const id = cve?.id;

  if (!id) {
    throw new Error("Missing cve.id in vulnerability record.");
  }

  const status = cve?.vulnStatus;

  // 1. DISCARD IMMEDIATELY: Check for "Rejected" status first, before any expensive checks
  if (status === "Rejected") {
    const rejectedError = new Error(`Rejected CVE ID: ${id}`);
    rejectedError.isRejected = true;
    throw rejectedError;
  }

  // 2. Mandatory Field Checks
  const published = cve?.published;
  const lastModified = cve?.lastModified;
  const description = cve.descriptions?.find((d) => d.lang === "en")?.value;

  if (!published) throw new Error(`Missing cve.published for CVE ID: ${id}`);
  if (!lastModified)
    throw new Error(`Missing cve.lastModified for CVE ID: ${id}`);
  if (!description)
    throw new Error(`Missing English description for CVE ID: ${id}`);

  // 3. Build the Final Record with only the simplified fields
  const record = {
    cveId: id,
    published: published,
    lastModified: lastModified,
    description: description,
  };

  return record;
};

/**
 * Processes a batch of raw NVD vulnerabilities.
 * Handles filtering, extraction, and logging of failures.
 * @param {Array<object>} vulnerabilities - Array of raw CVE records.
 */
async function processCveBatch(vulnerabilities) {
  const goodCves = [];
  let rejectedCount = 0;
  let failedCount = 0;

  const batchProcessed = vulnerabilities.length;
  // Update global processed count at the start of the batch
  // Note: We update totalProcessed here which might lead to non-sequential
  // logs in the console due to concurrency, but the final total will be correct.
  totalProcessed += batchProcessed;

  for (const vuln of vulnerabilities) {
    try {
      const extractedRecord = extractCveData(vuln);
      goodCves.push(extractedRecord);
      totalSuccessful++;
    } catch (error) {
      // Check for the 'Rejected' status filter
      if (error.isRejected) {
        rejectedCount++;
        totalRejected++;
        // No need to log rejected CVEs to badCVEs.jsonl
      } else {
        failedCount++;
        totalFailed++;
        console.error(
          `[BAD CVE] ${error.message}. Logging to ${BAD_CVES_FILE}`,
        );
        // Log the raw CVE object for inspection (only ID and reason)
        await logBadCve(vuln.cve, error.message);
      }
    }
  }

  const successfulCount = goodCves.length;

  if (goodCves.length > 0) {
    await postToDatabase(goodCves);
  }

  // Updated console output to show running totals and batch increments
  console.log(`Processed batch: ${batchProcessed}`);
  console.log(`  -> Total: ${totalProcessed} (+${batchProcessed})`);
  console.log(`  -> Successful: ${totalSuccessful} (+${successfulCount})`);
  console.log(`  -> Rejected:   ${totalRejected} (+${rejectedCount})`);
  console.log(`  -> Failed:     ${totalFailed} (+${failedCount})`);
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

  let maxRetries = 5;
  let delay = 1000;

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
        // Rate limit detected, must wait for the delay before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
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
 * Main function to fetch CVEs from the NVD API using rate-limited concurrency.
 */
async function fetchAllCvesConcurrently() {
  console.log("Starting initial fetch to determine total results...");

  // 1. Initial synchronous fetch to get totalResults
  const initialUrl = `${NVD_BASE_URL}/?resultsPerPage=1&startIndex=0`;
  let totalResults = 0;
  try {
    const response = await fetch(initialUrl, {
      headers: { apiKey: NVD_API_KEY, Accept: "application/json" },
    });
    const rawData = await response.json();
    totalResults = rawData.totalResults;
    console.log(`Total CVEs found: ${totalResults}`);
  } catch (error) {
    console.error(`CRITICAL: Initial API fetch failed: ${error.message}`);
    return;
  }

  // 2. Setup counters and file
  totalProcessed = 0;
  totalSuccessful = 0;
  totalRejected = 0;
  totalFailed = 0;
  await fs.writeFile(BAD_CVES_FILE, "", "utf-8"); // Clear the log file on start

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

  // 3. Simple rate-limited concurrent execution
  const runInParallel = async () => {
    for (let i = 0; i < startIndices.length; i++) {
      const startIndex = startIndices[i];

      // Wait until the number of active fetches is below the limit
      while (activeFetches >= MAX_CONCURRENT_FETCHES) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Short pause to wait for a slot
      }

      activeFetches++;

      // Start the fetch/process, but don't await it immediately
      const promise = fetchAndProcessBatch(startIndex, totalResults).finally(
        () => {
          activeFetches--; // Decrement active count when done
        },
      );
      promises.push(promise);

      // This is the CRITICAL rate limiter: wait 0ms before STARTING the next fetch.
      // This is where the 600ms was removed.
      // await new Promise(resolve => setTimeout(resolve, API_RATE_LIMIT_MS));
    }

    // Wait for all started promises to resolve
    await Promise.all(promises);
  };

  await runInParallel();

  console.log("\n--- NVD Synchronization Complete ---");
  console.log("--- FINAL RESULTS ---");
  console.log(`Total CVEs Retrieved (via NVD totalResults): ${totalResults}`);
  console.log(`Total CVEs Processed (in batches): ${totalProcessed}`);
  console.log(`Total Successful Records for Database: ${totalSuccessful}`);
  console.log(`Total Rejected (Status 'Rejected'): ${totalRejected}`);
  console.log(`Total Failed (Logged to badCVEs.jsonl): ${totalFailed}`);
}

fetchAllCvesConcurrently();
