import { createInterface } from "readline";

const API_SECRET_KEY = process.env.API_SECRET_KEY;
const API_URL_BASE = "http://localhost:3000";
const PAGE_LIMIT = 100; // Use the default limit from the server function

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Executes the mass deletion of CVE records by iteratively fetching
 * paginated batches and deleting each record in bulk.
 */
async function executeDeletion() {
  let skip = 0;
  let totalDeletedCount = 0;
  let totalCountFromHeader = 0;

  console.log(`\nStarting bulk deletion process...`);
  console.log(`Fetching records in batches of ${PAGE_LIMIT}.`);
  console.log(`Using bulk deletion endpoint: ${API_URL_BASE}`); // Main loop to fetch and delete pages

  while (true) {
    try {
      console.log(`\n--- Fetching batch: Skip=${skip} ---`); // 1. Fetch the next page of records
      const fetchUrl = `${API_URL_BASE}/api/cves?limit=${PAGE_LIMIT}&skip=${skip}`;
      const cvesResponse = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!cvesResponse.ok) {
        throw new Error(
          `GET request failed with status: ${cvesResponse.status}`,
        );
      }

      // Extract total count from header
      const totalCountHeader = cvesResponse.headers.get("X-Total-Count");
      totalCountFromHeader = totalCountHeader
        ? parseInt(totalCountHeader)
        : null;
      const data = await cvesResponse.json();
      const currentBatchSize = data.length;
      console.log(`Fetched ${currentBatchSize} records in this batch.`);

      // termination condition (stop if there is nothing left in the database)
      if (currentBatchSize === 0) {
        console.log("GET request returned zero CVEs. Deletion loop completed.");
        break; // Exit the while loop
      }

      const cveIdsToDelete = data.map((cve) => cve.cveId);
      console.log(
        `\n> Sending bulk DELETE request for ${cveIdsToDelete.length} CVE IDs...`,
      );

      const bulkDeletedResponse = await fetch(API_URL_BASE, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json", // MANDATORY for sending JSON body
          "x-api-key": API_SECRET_KEY,
        },
        body: JSON.stringify({ cveIds: cveIdsToDelete }),
      });

      const bulkDeleteResult = await bulkDeletedResponse.json();
      if (bulkDeletedResponse.ok) {
        const deletedCount =
          bulkDeleteResult.deletedCount || cveIdsToDelete.length;
        totalDeletedCount += deletedCount;
        console.log(`[SUCCESS] Bulk deleted ${deletedCount} CVEs.`);
      } else {
        console.error(
          `[ERROR] Failed to bulk delete batch: ${bulkDeleteResult.message || "Unknown Error"}`,
        );
        throw new Error(
          `Bulk deletion failed for batch starting at skip=${skip}`,
        );
      }

      skip = 0;
    } catch (error) {
      console.error(
        "\nAn error occurred during API communication or deletion:",
        error.message,
      );
      break; // Exit loop on critical error
    }
  }

  console.log(`\n======================================================`);
  console.log(`✅ Deletion operation finished.`);
  console.log(
    `Total CVEs recorded in header before starting: ${totalCountFromHeader || "N/A"}`,
  );
  console.log(`Total CVEs successfully deleted: ${totalDeletedCount}`);
  console.log(`======================================================`);
}

rl.question(
  '⚠️ THIS WILL DELETE ALL RECORDS IN THE DATABASE. ARE YOU SURE? Type "yes, DO IT" to continue: ',
  (answer) => {
    if (answer.trim() !== "yes, DO IT") {
      console.log("Operation cancelled.");
      rl.close();
      process.exit(0); // Use 0 for clean exit
    }
    rl.close();

    if (!API_SECRET_KEY) {
      console.log("❌ API_SECRET_KEY environment variable is required.");
      process.exit(1);
    } else {
      executeDeletion().catch((error) => {
        console.error("An unhandled error occurred:", error);
        process.exit(1);
      });
    }
  },
);
