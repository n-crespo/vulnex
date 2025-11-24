// import { createWriteStream } from "fs";
import axios from "axios";

const NVD_API_KEY = process.env.NVD_API_KEY;
// const OUTPUT_FILE = "output.jsonl";
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const API_BASE_URL = "http://localhost:3000/api/cves";

const RESULTS_PER_PAGE = 2000;

if (!API_SECRET_KEY) {
  console.warn("Warning: API_SECRET_KEY is not set. Execution stopped.");
  throw new Error("API_SECRET_KEY is required.");
}

const protectedClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "x-api-key": API_SECRET_KEY, "Content-Type": "application/json" },
});

async function postToDatabase(newCVEsArray) {
  console.log("Trying to post:");
  console.log(newCVEsArray);
  // const response = await protectedClient.post("/", newCVEsArray);
  // const status = response.status;
  // console.log("Response status: ", status);
  // if (status !== 200) {
  //   // success status
  //   throw new Error("Post to database failed: ", status);
  // }
}

/**
 * Tries to extract the highest available CVSS Base Score (V4.0 -> V3.1 -> V3.0 -> V2.0).
 * @param {object} metrics - The cve.metrics object.
 * @returns {number | string | undefined} The base score or undefined if none are found.
 */
const extractBaseScore = (metrics) => {
  if (!metrics) return undefined;

  // CVSS V4.0
  const v40Score = metrics.cvssMetricV40?.[0]?.cvssData?.baseScore;
  if (v40Score !== undefined) return v40Score;

  // CVSS V3.1
  const v31Score = metrics.cvssMetricV31?.[0]?.cvssData?.baseScore;
  if (v31Score !== undefined) return v31Score;

  // CVSS V3.0
  const v30Score = metrics.cvssMetricV30?.[0]?.cvssData?.baseScore;
  if (v30Score !== undefined) return v30Score;

  // CVSS V2.0 (Lowest Priority)
  const v2Score = metrics.cvssMetricV2?.[0]?.cvssData?.baseScore;
  if (v2Score !== undefined) return v2Score;

  return undefined;
};

/**
 * Recursively searches the CVE configurations structure to find all valid cpeMatch objects.
 * This ensures that if a match exists anywhere in the logical tree, it is found.
 * @param {Array<object>} configurations - The cve.configurations array.
 * @returns {Array<object>} A flattened array of { isVulnerable, cpeId } objects.
 */
const findAllCpeMatches = (configurations) => {
  if (!configurations || configurations.length === 0) {
    return [];
  }

  const allMatches = [];

  // Traverse the first level (configuration objects)
  for (const config of configurations) {
    if (config.nodes) {
      // Traverse the second level (node objects)
      for (const node of config.nodes) {
        if (node.cpeMatch) {
          // Traverse the third level (cpe_match objects)
          for (const match of node.cpeMatch) {
            // Check for the required fields in cpe_match
            const isVulnerable = match.vulnerable;
            const cpeId = match.criteria;

            if (isVulnerable !== undefined && cpeId) {
              allMatches.push({ isVulnerable, cpeId });
            }
          }
        }
      }
    }
  }
  return allMatches;
};

/**
 * Retrieves the first valid match found in the configurations.
 * Gets 'isVulnerable' and 'cpeId' fields.
 */
const extractConfiguration = (cve) => {
  const allMatches = findAllCpeMatches(cve.configurations);

  // Return the first match, or undefined if the array is empty
  return allMatches.length > 0 ? allMatches[0] : undefined;
};

const extractCveData = (vulnerability) => {
  const cve = vulnerability.cve;
  const id = cve?.id;

  if (!id) throw new Error("Missing cve.id in vulnerability record.");
  const published = cve?.published;
  const lastModified = cve?.lastModified;
  const status = cve?.vulnStatus;
  const description = cve.descriptions?.find((d) => d.lang === "en")?.value;

  if (!published) throw new Error(`Missing cve.published for CVE ID: ${id}`);
  if (!lastModified)
    throw new Error(`Missing cve.lastModified for CVE ID: ${id}`);
  if (!status) throw new Error(`Missing cve.vulnStatus for CVE ID: ${id}`);
  if (!description)
    throw new Error(`Missing English description for CVE ID: ${id}`);
  const baseSeverityScore = extractBaseScore(cve.metrics);
  if (baseSeverityScore === undefined) {
    console.log(cve);
    throw new Error(
      `Missing required CVSS Base Score (V4.0, V3.x, or V2.0) for CVE ID: ${id}`,
    );
  }

  const configData = extractConfiguration(cve);
  let isVulnerableValue;
  let cpeIdValue;

  if (configData) {
    isVulnerableValue = configData.isVulnerable;
    cpeIdValue = configData.cpeId;
  } else {
    isVulnerableValue = null;
    cpeIdValue = null;
    console.warn(
      `WARN: Missing configuration data for CVE ID: ${id}. Using NULL placeholders.`,
    );
  }
  const record = {
    cveId: id,
    published: published,
    lastModified: lastModified,
    status: status,
    description: description,
    baseSeverityScore: baseSeverityScore,
    isVulnerable: isVulnerableValue, // Use the fallback value
    cpeId: cpeIdValue, // Use the fallback value
  };
  if (cpeIdValue == null) {
    console.log("CVE with null:");
    console.log(record);
  }
  return record;
};

async function fetchRecentCves() {
  let startIndex = 0;
  let totalResults = Infinity;
  // const stream = createWriteStream(OUTPUT_FILE, { flags: "a" }); // "a" = append

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

      try {
        // parse json
        const extractedData = rawData.vulnerabilities.map(extractCveData);
        // stream.write(JSON.stringify(extractedData) + "\n");
        await postToDatabase(extractedData);
        console.log(
          `Successfully parsed and wrote ${extractedData.length} records in bulk.`,
        );
        console.log(
          `(${((startIndex / totalResults) * 100).toFixed(2)}%) ${startIndex}/${totalResults}`,
        );
      } catch (error) {
        console.error("Data Extraction Failed:", error.message);
        process.exit(0);
      }

      // respect NVD API rate limits
      // await new Promise((resolve) => setTimeout(resolve, 600)); // lower timeout with API key
    } catch (error) {
      console.log("Fetch/Processing error: ", error);
      break;
    }
  }
  // stream.end();
  console.log("done");
}

fetchRecentCves();
