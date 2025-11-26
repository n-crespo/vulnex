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
 * Writes a batch of processed CVE records to a writable stream, handling stream
 * backpressure to prevent overflow.
 * @param {Array<object>} cvesArray - The array of CVE record objects to be written.
 * @param {import('stream').Writable} outputStream - The writable stream (e.g., a file stream)
 * @returns {Promise<void>} Resolves when write is complete, handling backpressure.
 * @throws {Error} Throws an error if the stream operation fails.
 */
export function writeBatchToOutput(cvesArray, outputStream) {
  if (cvesArray.length === 0 || !outputStream) return;

  const data = JSON.stringify(cvesArray) + "\n";

  // Attempt to write the data
  console.log(`Writing ${cvesArray.length} CVEs to output stream...`);
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

// protectedClient: axios object with baseURL  and api key in header
export async function postToDatabase(newCVEsArray, protectedClient) {
  if (!newCVEsArray || newCVEsArray.length === 0) {
    console.log("No new CVE records to post.");
    return;
  }
  // console.log(`Attempting to post ${newCVEsArray.length} records...`);
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
