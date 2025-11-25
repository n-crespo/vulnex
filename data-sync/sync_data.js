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
const MAX_RETRIES = 6; // Updated as per successful run

// --- Global Counters for Total Reporting ---
let totalProcessed = 0;
let totalSuccessful = 0;
let totalRejected = 0;
let totalFailed = 0;

// --- Global Counters for Partial Data Failures (Unknown/Missing) ---
let totalMissingStatus = 0;
let totalUnknownVulnerability = 0;
let totalUnknownSeverity = 0;
let totalUnknownProduct = 0;

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

// =========================================================================
// MODULAR EXTRACTION FUNCTIONS
// The following functions implement the core logic for extracting specific fields.
// =========================================================================

/**
 * [MANDATORY FIELD EXTRACTOR] Extracts core fields needed for a valid record.
 * Throws an error if any of these are missing, resulting in total record failure.
 * @param {object} cve - The cve object.
 * @returns {{id: string, published: string, lastModified: string, description: string}}
 */
const extractRequiredFields = (cve) => {
  const id = cve?.id;
  const published = cve?.published;
  const lastModified = cve?.lastModified;
  const description = cve.descriptions?.find((d) => d.lang === "en")?.value;

  if (!id) throw new Error("Missing cve.id in vulnerability record.");
  if (!published) throw new Error(`Missing cve.published for CVE ID: ${id}`);
  if (!lastModified)
    throw new Error(`Missing cve.lastModified for CVE ID: ${id}`);
  if (!description)
    throw new Error(`Missing English description for CVE ID: ${id}`);

  return { id, published, lastModified, description };
};

/**
 * [SECONDARY FIELD EXTRACTOR] Extracts the vulnerability status.
 * Updates the global counter if the status cannot be determined.
 * @param {object} cve - The cve object.
 * @returns {string} "true", "false", or "Unknown".
 */
const extractVulnerability = (cve) => {
  // Recursive helper function (kept inline for simplicity, but could be separate)
  const traverseNodes = (nodes) => {
    if (!nodes) return;
    let foundAnyConfigMatch = false;

    for (const node of nodes) {
      if (node.cpeMatch && node.cpeMatch.length > 0) {
        foundAnyConfigMatch = true;
        for (const match of node.cpeMatch) {
          if (match.vulnerable === true) return "true";
        }
      }
      if (node.nodes && node.nodes.length > 0) {
        const result = traverseNodes(node.nodes);
        if (result === "true") return "true";
      }
    }
    return foundAnyConfigMatch ? "partial_false" : null;
  };

  const configurations = cve.configurations;
  if (!configurations || configurations.length === 0) {
    totalUnknownVulnerability++;
    return "Unknown";
  }

  let foundConfig = false;
  for (const config of configurations) {
    if (config.nodes && config.nodes.length > 0) {
      const result = traverseNodes(config.nodes);
      if (result === "true") return "true";
      if (result === "partial_false") foundConfig = true;
    }
  }

  if (foundConfig) {
    return "false";
  }

  totalUnknownVulnerability++;
  return "Unknown";
};

/**
 * [SECONDARY FIELD EXTRACTOR] Extracts the categorical severity level.
 * Updates the global counter if the severity level is not recognized.
 * @param {object} metrics - The cve.metrics object.
 * @returns {string} The base severity string ("NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", or "UNKNOWN").
 */
const extractSeverity = (metrics) => {
  if (!metrics) {
    totalUnknownSeverity++;
    return "UNKNOWN";
  }

  const validSeverities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

  const getSeverity = (metric) => {
    if (metric) {
      const v34Severity = metric[0]?.cvssData?.baseSeverity;
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

  severity = getSeverity(metrics.cvssMetricV2);
  if (severity) return severity;

  totalUnknownSeverity++;
  return "UNKNOWN";
};

/**
 * [SECONDARY FIELD EXTRACTOR] Extracts the CVE status.
 * Updates the global counter if the status is missing.
 * @param {object} cve - The cve object.
 * @returns {string} The status string or "Unknown".
 */
const extractStatus = (cve) => {
  const status = cve?.vulnStatus;
  if (!status) {
    totalMissingStatus++;
    return "Unknown";
  }
  return status;
};

/**
 * [SECONDARY FIELD EXTRACTOR] Extracts the product name and the version status (patch version or affected range).
 * Prioritizes 'versionEndExcluding' as the definitive patch version.
 * Updates the global counter if product details cannot be determined.
 * @param {object} cve - The cve object.
 * @returns {{productName: string, patchedInVersion: string, minAffectedVersion: string, maxAffectedVersion: string}}
 * An object containing the product name and the version status. Note: 'patchedInVersion' is the primary focus.
 */
const extractProductDetails = (cve) => {
  const UNKNOWN_PRODUCT_VALUE = "UNKNOWN";
  const UNKNOWN_VERSION_VALUE = "UNKNOWN_VERSION";

  const configurations = cve.configurations;

  let firstProductName = null;
  let patchedVersion = null; // NEW: Holds the versionEndExcluding value
  const specificVersions = new Set();

  const isWildcard = (v) => v === "*" || v === "-" || !v;

  // Recursive helper to traverse all nodes and collect data
  const traverseAndCollect = (nodes) => {
    if (!nodes) return;

    for (const node of nodes) {
      if (node.cpeMatch && node.cpeMatch.length > 0) {
        for (const match of node.cpeMatch) {
          const parts = match.criteria ? match.criteria.split(":") : [];

          if (parts.length >= 6) {
            const productName = parts[4];
            let versionInCriteria = parts[5];

            // 1. Capture the first valid product name found
            if (
              !firstProductName &&
              productName &&
              productName !== UNKNOWN_PRODUCT_VALUE
            ) {
              firstProductName = productName;
            }

            // 2. Capture the Patch Version (highest priority)
            if (!patchedVersion && match.versionEndExcluding) {
              patchedVersion = match.versionEndExcluding;
            } else if (!patchedVersion && match.versionEndIncluding) {
              // Sometimes 'versionEndIncluding' is used to define the last vulnerable version
              // We'll capture it, but 'Excluding' is usually cleaner.
              patchedVersion = match.versionEndIncluding;
            }

            // 3. Collect specific version numbers from criteria (as a fallback/range)
            if (!isWildcard(versionInCriteria)) {
              specificVersions.add(versionInCriteria);
            }
          }
        }
      }

      if (node.nodes && node.nodes.length > 0) {
        traverseAndCollect(node.nodes);
      }
    }
  };

  // Start traversal
  if (configurations && configurations.length > 0) {
    for (const config of configurations) {
      traverseAndCollect(config.nodes);
    }
  }

  // --- Determine Final Range and Product Name ---

  if (!firstProductName) {
    totalUnknownProduct++;
    return {
      productName: UNKNOWN_PRODUCT_VALUE,
      patchedInVersion: UNKNOWN_VERSION_VALUE, // Added new field
      minAffectedVersion: UNKNOWN_VERSION_VALUE,
      maxAffectedVersion: UNKNOWN_VERSION_VALUE,
    };
  }

  // Determine min/max affected versions from the collected criteria list
  let minVersion = UNKNOWN_VERSION_VALUE;
  let maxVersion = UNKNOWN_VERSION_VALUE;

  if (specificVersions.size > 0) {
    const sortedVersions = Array.from(specificVersions).sort();
    minVersion = sortedVersions[0];
    maxVersion = sortedVersions[sortedVersions.length - 1];
  }

  // If we found a patch version, use it. Otherwise, mark the patch field as UNKNOWN.
  const finalPatchedVersion = patchedVersion || UNKNOWN_VERSION_VALUE;

  // Final check for unknown status
  if (
    finalPatchedVersion === UNKNOWN_VERSION_VALUE &&
    specificVersions.size === 0
  ) {
    // We only count as Unknown if we found no patch version AND no criteria versions.
    totalUnknownProduct++;
  }

  // Success!
  return {
    productName: firstProductName,
    patchedInVersion: finalPatchedVersion, // Primary Field
    minAffectedVersion: minVersion,
    maxAffectedVersion: maxVersion,
  };
};

// =========================================================================
// PRIMARY PROCESSING LOGIC
// =========================================================================

/**
 * Extracts and validates all required fields from a single NVD vulnerability record.
 * @param {object} vulnerability - A single item from the NVD 'vulnerabilities' array.
 * @returns {object} The standardized and validated CVE record.
 */
const extractCveData = (vulnerability) => {
  const cve = vulnerability.cve;

  // 1. DISCARD IMMEDIATELY: Check for "Rejected" status first
  if (cve?.vulnStatus === "Rejected") {
    const rejectedError = new Error(`Rejected CVE ID: ${cve.id}`);
    rejectedError.isRejected = true;
    throw rejectedError;
  }

  // 2. Extract Mandatory Fields (Throws if fails -> totalFailed)
  const requiredData = extractRequiredFields(cve);

  // 3. Extract Secondary Fields (Fails gracefully -> updates partial counters)
  const finalStatus = extractStatus(cve);
  const isVulnerableString = extractVulnerability(cve);
  const severityLevel = extractSeverity(cve.metrics);
  const productDetails = extractProductDetails(cve); // Returns object with 4 fields

  // 4. Build the Final Record
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
  const initialUnknownProduct = totalUnknownProduct;

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
  const batchUnknownProduct = totalUnknownProduct - initialUnknownProduct;

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
  console.log(
    `  -> Unknown Product/Version: ${totalUnknownProduct} (+${batchUnknownProduct})`,
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

  let maxRetries = MAX_RETRIES; // Use constant
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
  totalUnknownProduct = 0;

  await fs.writeFile(BAD_CVES_FILE, "", "utf-8"); // Clear bad CVEs log file on start

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
  console.log(`Total Unknown Product/Version: ${totalUnknownProduct}`);
}

fetchAllCvesConcurrently();
