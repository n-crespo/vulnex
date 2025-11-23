import { createWriteStream } from "fs";

const NVD_API_KEY = process.env.NVD_API_KEY;
const OUTPUT_FILE = "output.jsonl";
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
// const API_BASE_URL = "http://localhost:3000/api/cves";

const RESULTS_PER_PAGE = 2000;

if (!API_SECRET_KEY) {
  console.warn("Warning: API_SECRET_KEY is not set. Execution stopped.");
  throw new Error("API_SECRET_KEY is required.");
}

async function fetchRecentCves() {
  let startIndex = 0;
  let totalResults = Infinity;
  const stream = createWriteStream(OUTPUT_FILE, { flags: "a" }); // "a" = append

  while (startIndex <= totalResults) {
    // example: https://services.nvd.nist.gov/rest/json/cves/2.0/?RESULTS_PER_PAGE=20&startIndex=0
    const NVD_API_URL = `${NVD_BASE_URL}/?resultsPerPage=${RESULTS_PER_PAGE}&startIndex=${startIndex}`;

    let requestOptions = {
      method: "GET",
      headers: {
        apiKey: NVD_API_KEY,
        Accept: "application/json",
      },
    };

    console.log(
      `starting fetch! (${((startIndex / totalResults) * 100).toFixed(2)}%) ${startIndex}/${totalResults}`,
    );

    try {
      const response = await fetch(NVD_API_URL, requestOptions);
      console.log("fetching...");
      if (response.status === 200) {
        console.log("Status: 200 OK. Request successful.");
      } else if (response.status === 403) {
        console.error("Status: 403 Forbidden.");
        throw new Error("Invalid API Key or forbidden access.");
      } else if (response.status === 429) {
        console.warn("Status: 429 Too Many Requests. Rate limit exceeded.");
        throw new Error("Rate limit exceeded.");
      } else if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();

      // update indices
      totalResults = rawData.totalResults;
      startIndex += RESULTS_PER_PAGE;

      // parse json
      const extractedData = rawData.vulnerabilities.map((v) => {
        const cve = v.cve;
        const id = cve.id;

        const record = {
          cveId: id,
          published: cve.published,
          lastModified: cve.lastModified,
          status: cve.vulnStatus,
          description: cve.descriptions.find((d) => d.lang === "en")?.value,
          baseSeverityScore:
            cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore,
          isVulnerable:
            cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.vulnerable,
          cpeId: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria,
        };
        return record;
      });
      stream.write(JSON.stringify(extractedData) + "\n");
      console.log(
        `Successfully parsed and wrote ${extractedData.length} records in bulk.`,
      );
      // respect NVD API rate limits
      // await new Promise((resolve) => setTimeout(resolve, 600)); // lower timeout with API key
    } catch (error) {
      console.log("Fetch/Processing error: ", error);
      break;
    }
  }
  stream.end();
  console.log("done");
}

fetchRecentCves();
