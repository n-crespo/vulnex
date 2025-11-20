import { createWriteStream } from "fs";

const NVD_API_KEY = process.env.NVD_API_KEY;
const OUTPUT_FILE = "output.json";

async function fetchRecentCves() {
  let totalResults = Infinity;
  let startIndex = 0;
  let resultsPerPage = 300;
  const stream = createWriteStream("output.json", { flags: "a" }); // "a" = append

  while (startIndex <= totalResults) {
    // example: https://services.nvd.nist.gov/rest/json/cves/2.0/?resultsPerPage=20&startIndex=0
    const API_URL = `https://services.nvd.nist.gov/rest/json/cves/2.0/?resultsPerPage=${resultsPerPage}&startIndex=${startIndex}`;

    let requestOptions = {
      method: "GET",
      headers: {
        apiKey: NVD_API_KEY,
        Accept: "application/json",
      },
    };

    console.log("starting fetch!", startIndex, totalResults);
    fetch(API_URL, requestOptions)
      .then((response) => {
        console.log("fetching");
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
        console.log("fetching...");
        totalResults = rawData.totalResults;
        startIndex += 300;
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
        // const jsonString = JSON.stringify(extractedData, null, 2);

        //  PERF: avoid giant stringify calls
        for (const item of extractedData) {
          stream.write(JSON.stringify(item) + "\n");
        }
        console.log(`Successfully wrote response to ${OUTPUT_FILE}`);
      })
      .catch((error) => {
        console.log("Fetch error:", error);
      });
    console.log("done");
  }
  stream.end();
}

fetchRecentCves();
