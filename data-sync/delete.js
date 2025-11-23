import { createInterface } from "readline";

// const API_SECRET_KEY = process.env.API_SECRET_KEY;
const API_SECRET_KEY =
  "g4alFVEBW6x/kq1GYX68RVXZ1XsVhZvkltmvTxpwUrUWOj0q4ZgKLbt7c1NX4RIV";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function executeDeletion() {
  // fetch all records
  const cves = await fetch("https://vulnex-api.onrender.com/api/cves", {
    method: "GET",
    "Content-Type": "application/json",
  });
  const data = await cves.json();
  // console.log(data);

  // Iterate and delete each record
  for (const cve of data) {
    const cveId = cve.cveId;
    console.log(`\nDeleting CVE ID: ${cveId}`);

    const deleted = await fetch(
      `https://vulnex-api.onrender.com/api/cves/${cveId}`,
      {
        method: "DELETE",
        headers: {
          "x-api-key": API_SECRET_KEY,
        },
      },
    );
    const deleteResult = await deleted.json();
    console.log("DELETING...");
    console.log(deleteResult);
  }

  console.log("\n✅ All deletion operations completed.");
}

rl.question(
  '⚠️ THIS WILL DELETE ALL RECORDS IN THE DATABASE. ARE YOU SURE? Type "yes, DO IT" to continue: ',
  (answer) => {
    if (answer.trim() !== "yes, DO IT") {
      console.log("Operation cancelled.");
      rl.close();
      process.exit(1);
    }
    rl.close();

    if (!API_SECRET_KEY) {
      console.log("API key is required.");
      return;
    } else {
      executeDeletion().catch((error) => {
        console.error("An error occurred during deletion:", error);
        process.exit(1);
      });
    }
  },
);
