import { createWriteStream } from "fs";

const NVD_API_KEY = process.env.NVD_API_KEY;
const OUTPUT_FILE = "output.jsonl";
const API_SECRET_KEY = process.env.API_SECRET_KEY;

async function fetchRecentCves() {
  let totalResults = Infinity;
  let startIndex = 0;
  let resultsPerPage = 800;
  const stream = createWriteStream(OUTPUT_FILE, { flags: "a" }); // "a" = append

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

    try {
      console.log(API_URL);
      console.log(requestOptions);
      const response = await fetch(API_URL, requestOptions);
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
      startIndex += resultsPerPage;

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

        stream.write(JSON.stringify(record) + "\n");

        // this writes CVEs to the database
        (async () => {
          console.log("sending request...");
          try {
            const postResponse = await fetch(
              "https://vulnex-api.onrender.com/api/cves",
              {
                method: "POST",
                headers: {
                  "x-api-key": API_SECRET_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(record),
              },
            );
            if (!postResponse.ok) {
              console.error(
                `Failed to post CVE ${id}: ${postResponse.status} ${postResponse.statusText}`,
              );
              console.log(postResponse);
            } else {
              console.log(`Successfully posted CVE ${id}`);
            }
          } catch (postError) {
            console.error(
              `Network error posting CVE ${id}:`,
              postError.message,
            );
          }
        })();
      });
      // respect NVD API rate limits
      // await new Promise((resolve) => setTimeout(resolve, 6000));

      // stringify with only 1 arg returns minified json.
      // const jsonString = JSON.stringify(extractedData);
      // const jsonString = JSON.stringify(extractedData, null, 2);
    } catch (error) {
      console.log("Fetch/Processing error: ", error);
      break;
    }
  }
  stream.end();
  console.log("done");
}

fetchRecentCves();
