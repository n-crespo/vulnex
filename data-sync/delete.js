import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  'THIS WILL DELETE ALL RECORDS IN THE DATABASE. ARE YOU SURE? Type "yes, I understand" to continue: ',
  (answer) => {
    if (answer.trim() !== "yes, I understand") {
      console.log("Operation cancelled.");
      process.exit(1);
    }
    rl.close();
  },
);

const cves = await fetch("https://vulnex-api.onrender.com/api/cves", {
  method: "GET",
  "Content-Type": "application/json",
});
const data = await cves.json();
// console.log(data);

data.forEach(async (cve) => {
  console.log(cve.cveId);
  const cveId = cve.cveId;
  console.log(`searching with cveId: ${cveId}`);

  const deleted = await fetch(
    `https://vulnex-api.onrender.com/api/cves/${cveId}`,
    {
      method: "DELETE",
      headers: {
        "x-api-key": process.env.API_SECRET_KEY,
      },
    },
  );
  const data = await deleted.json();
  console.log("DELETING...");
  console.log(data);
});
