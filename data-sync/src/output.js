import { promises as fs } from "fs";

/**
 * Helper function to append a failed CVE record to the log file.
 * @param {object} cveRecord - The raw CVE object that failed.
 * @param {string} reason - The reason for failure (e.g., missing field).
 */
export async function logBadCve(cveRecord, reason, BAD_CVES_FILE) {
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
export function writeBatchToOutput(cvesArray, outputStream) {
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

export async function postToDatabase(newCVEsArray) {
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
