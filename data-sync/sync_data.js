import { promises as fs } from "fs";
import { createWriteStream } from "fs";
// import axios from "axios";

// --- Configuration ---
const NVD_API_KEY = process.env.NVD_API_KEY;
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
// const API_BASE_URL = "http://localhost:3000/api/cves";

const RESULTS_PER_PAGE = 2000;
const BAD_CVES_FILE = "badCVEs.jsonl";
const OUTPUT_FILE = "output.jsonl";
// const API_RATE_LIMIT_MS = 0;
const MAX_CONCURRENT_FETCHES = 10;

// --- Global Counters for Total Reporting ---
let totalProcessed = 0;
let totalSuccessful = 0;
let totalRejected = 0;
let totalFailed = 0; // Total records failed entire validation (logged to badCVEs.jsonl)

// --- Global Counters for Partial Data Failures (new requirement) ---
let totalMissingStatus = 0;
let totalUnknownVulnerability = 0;
let totalUnknownSeverity = 0;

// --- Global Stream Handle ---
let outputStream = null;

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
    await fs.appendFile(BAD_CVES_FILE, logEntry, "utf-8");
  } catch (err) {
    console.error(`FATAL: Could not write to ${BAD_CVES_FILE}: ${err.message}`);
  }
}

/**
 * Helper function to write the entire batch of successful CVEs to the output file stream.
 * @param {Array<object>} cvesArray - The array of successfully extracted CVE records.
 * @returns {Promise<void>} Resolves when the write is complete, handling backpressure.
 */
function writeBatchToOutput(cvesArray) {
  if (cvesArray.length === 0 || !outputStream) return;

  const data = JSON.stringify(cvesArray) + "\n";

  // Attempt to write the data
  const canWrite = outputStream.write(data, "utf8");

  // Check for backpressure
  if (!canWrite) {
    // If the buffer is full, return a promise that resolves when the 'drain' event fires
    return new Promise((resolve) => {
      outputStream.once("drain", resolve);
    });
  }
  // Otherwise, the write was immediate, resolve immediately
  return Promise.resolve();
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
 * Tries to extract the highest available CVSS Base Severity (V4.0 -> V3.1 -> V3.0 -> V2.0).
 * Validates the severity string against the known CVSS categories.
 * @param {object} metrics - The cve.metrics object.
 * @returns {string} The base severity string ("NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", or "UNKNOWN").
 */
const extractBaseSeverity = (metrics) => {
  if (!metrics) return "UNKNOWN";

  // CVSS v3.x and v4.x standard severity levels
  const validSeverities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

  // Function to safely check and return severity
  const getSeverity = (metric) => {
    if (metric) {
      // Check V4.0, V3.1, V3.0
      const v34Severity = metric[0]?.cvssData?.baseSeverity;
      // Check V2.0 (severity is one level up)
      const v2Severity = metric[0]?.baseSeverity;

      const severity = v34Severity || v2Severity;

      if (severity !== undefined) {
        const upperSeverity = severity.toUpperCase();
        if (validSeverities.includes(upperSeverity)) {
          return upperSeverity;
        }
      }
    }
    return null;
  };

  // Priority: V4.0 -> V3.1 -> V3.0 -> V2.0
  let severity = getSeverity(metrics.cvssMetricV40);
  if (severity) return severity;

  severity = getSeverity(metrics.cvssMetricV31);
  if (severity) return severity;

  severity = getSeverity(metrics.cvssMetricV30);
  if (severity) return severity;

  // We are accepting V2 categorical severity if it matches the V3/V4 standards
  severity = getSeverity(metrics.cvssMetricV2);
  if (severity) return severity;

  return "UNKNOWN";
};

/**
 * Recursively searches the CVE configurations structure to find any cpeMatch object
 * marked as vulnerable: true.
 * * Logic:
 * 1. Returns "true" if ANY cpeMatch.vulnerable is true.
 * 2. Returns "false" if cve.configurations exists, but ALL cpeMatch.vulnerable are false.
 * 3. Returns "Unknown" if cve.configurations is missing or empty.
 * * @param {object} cve - The cve object.
 * @returns {string} "true", "false", or "Unknown".
 */
const extractIsVulnerableStatus = (cve) => {
  const configurations = cve.configurations;
  if (!configurations || configurations.length === 0) {
    return "Unknown";
  }

  // Flag to check if we found any valid config node/match at all
  let foundAnyConfigMatch = false;

  // Recursive helper to traverse nodes (which contain cpeMatch arrays or nested nodes)
  const traverseNodes = (nodes) => {
    if (!nodes) return;

    for (const node of nodes) {
      if (node.cpeMatch && node.cpeMatch.length > 0) {
        foundAnyConfigMatch = true;
        for (const match of node.cpeMatch) {
          // If we find any single true, the record is globally "true"
          if (match.vulnerable === true) {
            return "true";
          }
        }
      }

      // If there are nested nodes (e.g., AND/OR groups), recurse
      if (node.nodes && node.nodes.length > 0) {
        const result = traverseNodes(node.nodes);
        if (result === "true") return "true"; // Bubble up the true result
      }
    }
  };

  // Start traversal from the top level configurations
  for (const config of configurations) {
    if (config.nodes && config.nodes.length > 0) {
      const result = traverseNodes(config.nodes);
      if (result === "true") return "true"; // Found a definitive TRUE
    }
  }

  // If we reached here, no 'vulnerable: true' was found.
  // We check if we found ANY config matches (meaning all found were explicitly 'vulnerable: false').
  if (foundAnyConfigMatch) {
    return "false";
  }

  // If we didn't find any configuration structure at all
  return "Unknown";
};

/**
 * Extracts and validates all required fields from a single NVD vulnerability record.
 * @param {object} vulnerability - A single item from the NVD 'vulnerabilities' array.
 * @returns {object} The standardized and validated CVE record.
 */
const extractCveData = (vulnerability) => {
  const cve = vulnerability.cve;
  const id = cve?.id;

  if (!id) {
    throw new Error("Missing cve.id in vulnerability record.");
  }

  const status = cve?.vulnStatus;

  // 1. DISCARD IMMEDIATELY: Check for "Rejected" status first
  if (status === "Rejected") {
    const rejectedError = new Error(`Rejected CVE ID: ${id}`);
    rejectedError.isRejected = true;
    throw rejectedError;
  }

  // 2. Mandatory Field Checks (for throwing a TOTAL FAILURE)
  const published = cve?.published;
  const lastModified = cve?.lastModified;
  const description = cve.descriptions?.find((d) => d.lang === "en")?.value;

  if (!published) throw new Error(`Missing cve.published for CVE ID: ${id}`);
  if (!lastModified)
    throw new Error(`Missing cve.lastModified for CVE ID: ${id}`);
  // NOTE: Status is checked below for partial failure, but we check here for total failure.
  if (!status) throw new Error(`Missing cve.vulnStatus for CVE ID: ${id}`);
  if (!description)
    throw new Error(`Missing English description for CVE ID: ${id}`);

  // 3. Extract Secondary Fields & Check for PARTIAL FAILURE

  // --- 3a. Status (Only check if we missed it above, although unlikely) ---
  let finalStatus = status; // Already checked for existence in mandatory checks

  // --- 3b. Vulnerable Status ---
  const isVulnerableString = extractIsVulnerableStatus(cve);

  // --- 3c. Severity Level ---
  const severityLevel = extractBaseSeverity(cve.metrics);

  // 4. Update PARTIAL FAILURE counters
  if (!finalStatus) {
    totalMissingStatus++;
    finalStatus = "Unknown";
  }

  if (isVulnerableString === "Unknown") {
    totalUnknownVulnerability++;
  } else {
    // If not "Unknown", it means we successfully determined "true" or "false"
    // We remove the old counter totalVulnerableKnown since we are tracking the negative now.
    // If you need it back, we can re-add it.
  }

  if (severityLevel === "UNKNOWN") {
    totalUnknownSeverity++;
  }

  // 5. Build the Final Record
  const record = {
    cveId: id,
    published: published,
    lastModified: lastModified,
    status: finalStatus,
    description: description,
    isVulnerable: isVulnerableString,
    severityLevel: severityLevel,
  };

  return record;
};

/**
 * Processes a batch of raw NVD vulnerabilities.
 * @param {Array<object>} vulnerabilities - Array of raw CVE records.
 */
async function processCveBatch(vulnerabilities) {
  const goodCves = [];
  let rejectedCount = 0;
  let failedCount = 0;

  // Capture current global partial failure counts before processing the batch
  const initialMissingStatus = totalMissingStatus;
  const initialUnknownVulnerable = totalUnknownVulnerability;
  const initialUnknownSeverity = totalUnknownSeverity;

  const batchProcessed = vulnerabilities.length;
  // Update global processed count at the start of the batch
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
      } else {
        failedCount++;
        totalFailed++;
        console.error(
          `[BAD CVE] ${error.message}. Logging to ${BAD_CVES_FILE}`,
        );
        // Use the raw cve object for logging the failure
        await logBadCve(vuln.cve, error.message);
      }
    }
  }

  const successfulCount = goodCves.length;

  // Calculate batch partial failure increments
  const batchMissingStatus = totalMissingStatus - initialMissingStatus;
  const batchUnknownVulnerable =
    totalUnknownVulnerability - initialUnknownVulnerable;
  const batchUnknownSeverity = totalUnknownSeverity - initialUnknownSeverity;

  if (goodCves.length > 0) {
    // 1. Write the successful batch to output.jsonl, handling backpressure
    await writeBatchToOutput(goodCves);

    // 2. Post to database (placeholder)
    await postToDatabase(goodCves);
  }

  // Updated console output to show running totals and batch increments
  console.log(`Processed batch: ${batchProcessed}`);
  console.log(`  -> Total: ${totalProcessed} (+${batchProcessed})`);
  console.log(`  -> Successful: ${totalSuccessful} (+${successfulCount})`);
  console.log(`  -> Rejected:   ${totalRejected} (+${rejectedCount})`);
  console.log(
    `  -> Failed (Total Validation): ${totalFailed} (+${failedCount})`,
  );
  console.log(
    `  -> Missing Status Field: ${totalMissingStatus} (+${batchMissingStatus})`,
  );
  console.log(
    `  -> Unknown isVulnerable: ${totalUnknownVulnerability} (+${batchUnknownVulnerable})`,
  );
  console.log(
    `  -> Unknown Severity Levels: ${totalUnknownSeverity} (+${batchUnknownSeverity})`,
  );
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

  let maxRetries = 6;
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

        // --- JITTER IMPLEMENTATION ---
        // Calculate a random waiting time between 50% and 100% of the current delay
        const minDelay = delay / 2;
        const jitterDelay =
          Math.floor(Math.random() * (delay - minDelay + 1)) + minDelay;

        // Wait for the randomized delay
        await new Promise((resolve) => setTimeout(resolve, jitterDelay));

        // Exponential backoff, capping at 60 seconds
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
  totalMissingStatus = 0;
  totalUnknownVulnerability = 0;
  totalUnknownSeverity = 0;

  await fs.writeFile(BAD_CVES_FILE, "", "utf-8"); // Clear bad CVEs log file on start

  // NEW: Initialize the Writable Stream
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

  console.log("\n--- NVD Synchronization Complete ---");
  console.log("--- FINAL RESULTS ---");
  console.log(`Total CVEs Retrieved (via NVD totalResults): ${totalResults}`);
  console.log(`Total CVEs Processed (in batches): ${totalProcessed}`);
  console.log(`Total Successful Records for Database: ${totalSuccessful}`);
  console.log(`Total Rejected (Status 'Rejected'): ${totalRejected}`);
  console.log(`Total Failed (Logged to badCVEs.jsonl): ${totalFailed}`);
  console.log(`Total Missing Status Field: ${totalMissingStatus}`);
  console.log(`Total Unknown isVulnerable: ${totalUnknownVulnerability}`);
  console.log(`Total Unknown Severity Levels: ${totalUnknownSeverity}`);
}

fetchAllCvesConcurrently();
