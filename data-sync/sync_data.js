import { writeFile } from "fs/promises";

const NVD_API_KEY = process.env.NVD_API_KEY;

const requestOptions = {
  method: "GET",
  headers: {
    apiKey: NVD_API_KEY,
    Accept: "application/json",
    resultsPerPage: 1,
  },
};

async function fetchRecentCves() {
  const RESULTS_PER_PAGE = 300;
  const START_INDEX = 0;
  const OUTPUT_FILE = "output.json";

  // example: https://services.nvd.nist.gov/rest/json/cves/2.0/?resultsPerPage=20&startIndex=0
  const API_URL = `https://services.nvd.nist.gov/rest/json/cves/2.0/?resultsPerPage=${RESULTS_PER_PAGE}&startIndex=${START_INDEX}`;

  fetch(API_URL, requestOptions)
    .then((response) => {
      if (response.status === 200) {
        console.log("Status: 200 OK. Request successful.");
      } else if (response.status === 403) {
        console.error("Status: 403 Forbidden.");
        throw new Error("Invalid API Key or forbidden access.");
      } else if (response.status === 429) {
        console.warn("Status: 429 Too Many Requests. Rate limit exceeded.");
        throw new Error("Rate limit exceeded.");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(async (rawData) => {
      const extractedData = rawData.vulnerabilities.map((v) => {
        const cve = v.cve;
        const id = cve.id;
        const published = cve.published;
        const lastModified = cve.lastModified;
        const status = cve.vulnStatus;
        const description = cve.descriptions.find(
          (d) => d.lang === "en",
        )?.value;
        const baseSeverityScore =
          cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore;

        const firstMatch = cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0];
        const isVulnerable = firstMatch?.vulnerable;
        const cpeId = firstMatch?.criteria;

        return {
          id,
          published,
          lastModified,
          status,
          description,
          baseSeverityScore,
          isVulnerable,
          cpeId,
        };
      });

      // stringify with only 1 arg returns minified json.
      // const jsonString = JSON.stringify(extractedData);
      const jsonString = JSON.stringify(extractedData, null, 2);

      await writeFile(OUTPUT_FILE, jsonString);
      console.log(`Successfully wrote response to ${OUTPUT_FILE}`);
      // console.log("Data received: ", data);
    })
    .catch((error) => {
      console.log("Fetch error:", error);
    });
}

fetchRecentCves();
