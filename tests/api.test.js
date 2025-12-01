import { expect } from "chai";
import { compareVersions } from "../utils/version_comparator.js";
import axios from "axios";
import net from "net";

const PORT = process.env.PORT || 3000;
const LOCAL_URL_BASE = `http://localhost:${PORT}`;
const VALID_API_KEY = process.env.API_SECRET_KEY;
const REMOTE_TIMEOUT = 15000;
// const REMOTE_URL_BASE = `https://vulnex-api.onrender.com`;

const BAD_REQUEST_STATUS = 400;
const SUCCESS_STATUS = 200;
const UNAUTHORIZED_STATUS = 401;
const NOT_FOUND_STATUS = 404;

// Sample data for the test record
const singleNewCVE = {
  cveId: "CVE-2090-0000",
  published: "2006-09-20T04:07:00.000Z",
  description: "TEST CVE",
  severityLevel: "MEDIUM",
  productName: "test-product",
  productVersions: [{ start: "0.5", end: "5.1", s_type: "i", e_type: "e" }],
};

const singleBadCVE = {
  cveId: "CVE-22006-4884", // invalid CVE id
  published: "2006-09-20T04:07:00.000Z",
  description: "TEST CVE",
  severityLevel: "MEDIUM",
  productName: "test-product",
  productVersions: [{ start: "0.5", end: "5.1", s_type: "i", e_type: "e" }],
};

// Data for the update operation
const singleUpdateToCVE = {
  severityLevel: "CRITICAL",
};

// Sample data for bulk actions
const bulkNewCVEs = [
  {
    cveId: "CVE-2090-0001",
    published: "2006-09-20T04:07:00.000Z",
    description: "TEST CVE",
    severityLevel: "HIGH",
    productName: "shadowed_portal",
    productVersions: [{ start: "0.5", end: "5.1", s_type: "i", e_type: "e" }],
  },
  {
    cveId: "CVE-2090-0002",
    published: "2006-09-20T04:07:00.000Z",
    description: "TEST CVE",
    severityLevel: "HIGH",
    productName: "apple_remote_desktop",
    productVersions: [{ start: "0.5", end: "5.1", s_type: "i", e_type: "e" }],
  },
];

const bulkCveIds = { cveIds: bulkNewCVEs.map((cve) => cve.cveId) };

const bulkUpdatesToCVEs = [
  {
    cveId: "CVE-2090-0001",
    update: {
      severityLevel: "NONE",
      productVersions: [{ start: "0.5", end: "5.2", s_type: "i", e_type: "e" }],
    },
  },
  {
    cveId: "CVE-2090-0002",
    update: {
      severityLevel: "NONE",
    },
  },
  {
    cveId: "TEST-BULK-NONEXISTENT", // this should fail (invalid CVE)
    update: {
      status: "Test Nonexistent",
    },
  },
];

// helper function to check if a specific version falls within a CVE's version ranges
const isVersionApplicable = (cve, targetVersion) => {
  // Must have productVersions to check applicability
  if (!cve.productVersions || cve.productVersions.length === 0) {
    return false;
  }

  // iterate through all version ranges for the CVE
  return cve.productVersions.some((range) => {
    const { start, end, s_type, e_type } = range;

    // Check Start Boundary (targetVersion compared to start)
    const startComparison = compareVersions(targetVersion, start);
    let meetsStartCondition = false;
    if (s_type === "i") {
      // inclusive
      meetsStartCondition = startComparison >= 0;
    } else if (s_type === "e") {
      // exclusive
      meetsStartCondition = startComparison > 0;
    } else {
      // Assume inclusive if type is missing or unknown for robustness
      meetsStartCondition = startComparison >= 0;
    }

    // Check End Boundary (targetVersion compared to end)
    const endComparison = compareVersions(targetVersion, end);
    let meetsEndCondition = false;
    if (e_type === "i") {
      // inclusive
      meetsEndCondition = endComparison <= 0;
    } else if (e_type === "e") {
      // exclusive
      meetsEndCondition = endComparison < 0;
    } else {
      // Assume inclusive if type is missing or unknown for robustness
      meetsEndCondition = endComparison <= 0;
    }

    // The version is applicable if it meets both start and end conditions
    return meetsStartCondition && meetsEndCondition;
  });
};

// Helper function used to verify that the CVE's 'published' field falls within the specified date range.
const isDateWithinRange = (cve, startDateStr, endDateStr) => {
  // Parse the CVE's published date, which is stored as an ISO string.
  const publishedDate = new Date(cve.published);

  let meetsStartCondition = true;
  let meetsEndCondition = true;

  if (startDateStr) {
    const startDate = new Date(startDateStr);
    // Verify condition: publishedDate >= startDate
    meetsStartCondition = publishedDate.getTime() >= startDate.getTime();
  }

  if (endDateStr) {
    const endDate = new Date(endDateStr);
    // Verify condition: publishedDate <= endDate
    meetsEndCondition = publishedDate.getTime() <= endDate.getTime();
  }

  return meetsStartCondition && meetsEndCondition;
};

/**
 * Executes the full CRUD and security check sequence for a given base URL.
 * @param {string} baseUrl - The base URL of the server (e.g., http://localhost:3000)
 * @param {string} environmentName - A friendly name for the test block (e.g., 'LOCAL')
 */
const runApiTests = (baseUrl, environmentName) => {
  const apiEndpoint = `${baseUrl}/api/cves`;
  let createdCveId = null; // will use in tests later to verify cve creation

  // this is a public user (without an API key)
  const publicClient = axios.create({
    baseURL: apiEndpoint,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // this is an admin user (with an API key)
  const protectedClient = axios.create({
    baseURL: apiEndpoint,
    headers: { "x-api-key": VALID_API_KEY, "Content-Type": "application/json" },
  });

  describe(`---------------------------------\n${environmentName} SERVER TESTS | (${baseUrl})`, function () {
    this.timeout(REMOTE_TIMEOUT); // Extended timeout for remote server

    describe(`PUBLIC READ ACCESS TESTS`, function () {
      // --- PUBLIC READ ACCESS TESTS ---

      it(`GET / should allow PUBLIC access to the root ("/") (200 OK)`, async () => {
        const response = await axios.get(baseUrl);
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data).to.include("hello from node API");
      });

      it(`GET /api/cves should allow PUBLIC access to all CVEs (200 OK and array)`, async () => {
        const response = await publicClient.get("/");
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data).to.be.an("array");
      });
    });

    describe(`PROTECTED POST (CREATE) ACCESS TESTS`, function () {
      it(`POST /api/cves should FAIL without API Key (401 Unauthorized)`, async () => {
        let errorStatus;
        try {
          await publicClient.post("/", singleNewCVE);
        } catch (error) {
          errorStatus = error.response.status;
        }
        // Verify security failure
        expect(errorStatus).to.equal(UNAUTHORIZED_STATUS);
      });

      it(`POST /api/cves should FAIL with API Key + Invalid CVE (400 Bad Request)`, async () => {
        let errorStatus;
        try {
          await protectedClient.post("/", singleBadCVE);
        } catch (error) {
          errorStatus = error.response.status;
        }
        // Verify security failure
        expect(errorStatus).to.equal(BAD_REQUEST_STATUS); // bad request
      });

      it(`POST /api/cves should PASS WITH API Key and return the created CVE (200 OK)`, async () => {
        const response = await protectedClient.post("/", singleNewCVE);
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data).to.have.property("cveId");
        createdCveId = response.data.cveId; // Store ID for later tests
      });

      it(`GET /api/cves/:id should allow PUBLIC access to the newly created CVE (200 OK)`, async () => {
        const response = await publicClient.get(`/${createdCveId}`);
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data.cveId).to.equal(singleNewCVE.cveId);
      });
    });

    describe(`PROTECTED PUT (UPDATE) TESTS`, function () {
      it(`PUT /api/cves/:id should FAIL without API Key (401 Unauthorized)`, async () => {
        let errorStatus;
        try {
          await publicClient.put(`/${createdCveId}`, singleUpdateToCVE);
        } catch (error) {
          errorStatus = error.response.status;
        }
        expect(errorStatus).to.equal(UNAUTHORIZED_STATUS);
      });

      it(`PUT /api/cves/:id should PASS WITH API Key and update the CVE (200 OK)`, async () => {
        const response = await protectedClient.put(
          `/${createdCveId}`,
          singleUpdateToCVE,
        );
        // NOTE: Expecting 200, and the controller returns the updated CVE body
        expect(response.status).to.equal(SUCCESS_STATUS);
        // Check that returned object contains the update
        expect(response.data.severityLevel).to.equal(
          singleUpdateToCVE.severityLevel,
        );
      });

      it(`GET /api/cves/:id should verify the update ("CRITICAL") (200 OK)`, async () => {
        const response = await publicClient.get(`/${createdCveId}`);
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data.severityLevel).to.equal(
          singleUpdateToCVE.severityLevel,
        );
      });
    });

    describe(`PROTECTED DELETE TESTS`, function () {
      it(`DELETE /api/cves/:id should FAIL without API Key (401 Unauthorized)`, async () => {
        let errorStatus;
        try {
          await publicClient.delete(`/${createdCveId}`);
        } catch (error) {
          errorStatus = error.response.status;
        }
        // verify security failure
        expect(errorStatus).to.equal(UNAUTHORIZED_STATUS);
      });

      it(`DELETE /api/cves/:id should PASS WITH API Key (200 OK)`, async () => {
        const response = await protectedClient.delete(`/${singleNewCVE.cveId}`);
        expect(response.status).to.equal(SUCCESS_STATUS);
        // check message from delete controller
        expect(response.data.message).to.equal("CVE deleted successfully");
      });

      it(`GET /api/cves/:id should FAIL after deletion (404 Not Found)`, async () => {
        let errorStatus;
        try {
          await publicClient.get(`/${createdCveId}`);
        } catch (error) {
          errorStatus = error.response.status;
        }
        // should return 404 when not found
        expect(errorStatus).to.equal(NOT_FOUND_STATUS);
      });
    });

    describe(`BULK CREATE (POST) TESTS`, function () {
      it(`POST (bulk) /api/cves should PASS WITH API Key and create multiple CVEs (200 OK)`, async () => {
        const response = await protectedClient.post("/", bulkNewCVEs);
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data.data).to.be.an("array");
        expect(response.data.count).to.equal(bulkNewCVEs.length); // Verify creation of a specific CVE from the bulk operation
        expect(
          response.data.data.some((cve) => cve.cveId === bulkCveIds.cveIds[0]),
        ).to.be.true;
      });

      it(`GET /api/cves/:id should allow PUBLIC access to a bulk created CVE (${bulkCveIds.cveIds[0]})`, async () => {
        const response = await publicClient.get(`/${bulkCveIds.cveIds[0]}`);
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data.cveId).to.equal(bulkCveIds.cveIds[0]);
      });

      it(`POST /api/cves/ should FAIL with invalid CVEs`, async () => {
        const bulkCVEsWithInvalidEntry = [...bulkNewCVEs, singleBadCVE];
        try {
          await protectedClient.post(`/`, bulkCVEsWithInvalidEntry);
        } catch (error) {
          // console.log(error.response);
          expect(error.response.status).to.equal(BAD_REQUEST_STATUS);
        }
      });
    });

    describe(`BULK UPDATE (PUT) TESTS`, function () {
      it(`PUT /api/cves/ should FAIL without API Key (401 Unauthorized)`, async () => {
        let errorStatus;
        try {
          await publicClient.put(`/`, bulkUpdatesToCVEs);
        } catch (error) {
          errorStatus = error.response.status;
        } // Verify security failure
        expect(errorStatus).to.equal(UNAUTHORIZED_STATUS);
      });

      it(`PUT /api/cves/ should PASS WITH API Key and update multiple CVEs (200 OK)`, async () => {
        const response = await protectedClient.put(`/`, bulkUpdatesToCVEs);
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data).to.have.property("matchedCount");
        expect(response.data).to.have.property("modifiedCount");
        expect(response.data.matchedCount).to.equal(
          bulkUpdatesToCVEs.length - 1,
        );
        // Expect 2 CVEs to be modified (assuming the updates are real changes)
        expect(response.data.modifiedCount).to.equal(2);
      });

      it(`GET /api/cves/:id should verify the bulk update on ${bulkCveIds.cveIds[0]} `, async () => {
        const response = await publicClient.get(`/${bulkCveIds.cveIds[0]}`);
        expect(response.status).to.equal(SUCCESS_STATUS);
        expect(response.data.severityLevel).to.equal(
          bulkUpdatesToCVEs[0].update.severityLevel,
        );
        expect(response.data.patchedInVersion).to.equal(
          bulkUpdatesToCVEs[0].update.patchedInVersion,
        );
      });

      it(`PUT /api/cves/ should FAIL with 400 Bad Request on empty array body`, async () => {
        let errorStatus;
        try {
          await protectedClient.put(`/`, []);
        } catch (error) {
          errorStatus = error.response.status;
          expect(error.response.data.message).to.include("non-empty array");
        }
        expect(errorStatus).to.equal(BAD_REQUEST_STATUS);
      });

      it(`PUT /api/cves/ should FAIL with 400 Bad Request if all items are invalid/malformed`, async () => {
        let errorStatus;
        const invalidUpdates = [
          { cveId: "ID-1", update: {} }, // Invalid: empty update object
          { update: { status: "Test" } }, // Invalid: missing cveId
        ];
        try {
          await protectedClient.put(`/`, invalidUpdates);
        } catch (error) {
          errorStatus = error.response.status;
          expect(error.response.data.message).to.include(
            "No valid update operations",
          );
        }
        expect(errorStatus).to.equal(BAD_REQUEST_STATUS);
      });
    });

    describe(`BULK DELETE TESTS`, function () {
      it(`DELETE /api/cves/bulk-delete should FAIL without API Key (401 Unauthorized)`, async () => {
        let errorStatus;
        try {
          await publicClient.delete(`/bulk-delete`, { data: bulkCveIds }); // axios delete with body uses `data` config
        } catch (error) {
          errorStatus = error.response.status;
        } // Verify security failure
        expect(errorStatus).to.equal(UNAUTHORIZED_STATUS);
      });

      it(`DELETE /api/cves should PASS WITH API Key and delete multiple CVEs (200 OK)`, async () => {
        // Pass the array of IDs in the request body for bulk delete
        const response = await protectedClient.delete(`/bulk-delete`, {
          data: bulkCveIds, // Array of cveIds: ["CVE-BULK-2029-001", "CVE-BULK-2029-002"]
        });
        expect(response.status).to.equal(SUCCESS_STATUS); // Assuming controller returns count or a success message
        expect(response.data).to.have.property("deletedCount");
        expect(response.data.deletedCount).to.be.at.most(
          bulkCveIds.cveIds.length,
        );
        expect(response.data.requestedCount).to.equal(bulkCveIds.cveIds.length);
      });

      it(`GET /api/cves/:id should FAIL after bulk deletion (${bulkCveIds.cveIds[0]}) (404 Not Found)`, async () => {
        let errorStatus;
        try {
          await publicClient.get(`/${bulkCveIds.cveIds[0]}`);
        } catch (error) {
          errorStatus = error.response.status;
        }
        expect(errorStatus).to.equal(NOT_FOUND_STATUS);
      });

      it(`DELETE /api/cves/bulk-delete should FAIL with 400 Bad Request on empty cveIds array`, async () => {
        let errorStatus;
        try {
          await protectedClient.delete(`/bulk-delete`, {
            data: { cveIds: [] },
          });
        } catch (error) {
          errorStatus = error.response.status;
          expect(error.response.data.message).to.include("non-empty array");
        }
        expect(errorStatus).to.equal(BAD_REQUEST_STATUS);
      });

      it(`DELETE /api/cves/bulk-delete should FAIL with 400 Bad Request on missing cveIds property`, async () => {
        let errorStatus;
        try {
          await protectedClient.delete(`/bulk-delete`, { data: {} }); // Empty body
        } catch (error) {
          errorStatus = error.response.status;
          expect(error.response.data.message).to.include("non-empty array");
        }
        expect(errorStatus).to.equal(BAD_REQUEST_STATUS);
      });

      it(`DELETE /api/cves/bulk-delete should return 404 Not Found when no matching CVEs are deleted`, async () => {
        let errorStatus;
        const nonExistentIds = {
          cveIds: ["CVE-NON-EXISTENT-111", "CVE-NON-EXISTENT-222"],
        };

        try {
          await protectedClient.delete(`/bulk-delete`, {
            data: nonExistentIds,
          });
        } catch (error) {
          errorStatus = error.response.status;
          expect(error.response.data.message).to.include(
            "No matching CVEs found for deletion.",
          );
        }
        expect(errorStatus).to.equal(NOT_FOUND_STATUS);
      });
    });

    describe(`FILTERING TESTS (GET)`, function () {
      it(`GET /api/cves?productName=dompurify should return CVEs with specified product (case-insensitive)`, async () => {
        const queryProductName = "dompurify";
        const response = await publicClient.get(
          `${baseUrl}/api/cves?productName=${queryProductName}`,
        );
        expect(response.status).to.equal(SUCCESS_STATUS);

        const cves = response.data;
        expect(cves)
          .to.be.an("array")
          // NOTE: this assumes there are CVEs with `dompurify` in the productName
          // (reasonable assumption, there are many)
          .with.lengthOf.at.least(1, "The array of CVEs should not be empty");

        cves.forEach((c) => {
          // check that productName includes the query string (ignoring case)
          expect(c.productName.toLowerCase()).to.include(
            queryProductName.toLowerCase(),
            `Product name '${c.productName}' must include '${queryProductName}'`,
          );
        });
      });

      it(`GET /api/cves?productName=dompurify&severityLevel=CRITICAL should return CVEs with specified product name/severity`, async () => {
        const queryProductName = "dompurify";
        const querySeverityLevel = "CRITICAL";

        const response = await publicClient.get(
          `${baseUrl}/api/cves?productName=${queryProductName}&severityLevel=${querySeverityLevel}`,
        );

        expect(response.status).to.equal(SUCCESS_STATUS);

        const cves = response.data;

        // ensure results were returned
        expect(cves)
          .to.be.an("array")
          .with.lengthOf.at.least(
            1,
            `Expected at least one CVE with productName containing '${queryProductName}' and severityLevel='${querySeverityLevel}'`,
          );

        // ensure all returned CVEs have matching product name
        cves.forEach((c) => {
          // Check that productName includes the query string (case-insensitive)
          expect(c.productName.toLowerCase()).to.include(
            queryProductName.toLowerCase(),
            `Product name '${c.productName}' must include '${queryProductName}'`,
          );

          // ensure all returned CVEs have matching severity level
          expect(c.severityLevel).to.equal(
            querySeverityLevel,
            `Severity level '${c.severityLevel}' must be equal to '${querySeverityLevel}'`,
          );
        });
      });

      it(`GET /api/cves?productName=dompurify&version=3.0.0 should return CVEs with specified product/version/severity`, async () => {
        const queryProductName = "dompurify";
        const queryVersion = "3.0.0";

        const response = await publicClient.get(
          `${baseUrl}/api/cves?productName=${queryProductName}&version=${queryVersion}`,
        );

        // check HTTP Status
        expect(response.status).to.equal(SUCCESS_STATUS);

        const cves = response.data;

        // check that results were returned
        expect(cves)
          .to.be.an("array")
          .with.lengthOf.at.least(
            1,
            `Expected at least one CVE for product '${queryProductName}' applicable to version '${queryVersion}'`,
          );

        // iterate and check ALL filtering conditions
        cves.forEach((cve) => {
          // check productName includes the query string (case-insensitive)
          expect(cve.productName.toLowerCase()).to.include(
            queryProductName.toLowerCase(),
            `Product name '${cve.productName}' must include '${queryProductName}'`,
          );

          // check the version applicability filter was correctly applied by the server
          expect(
            isVersionApplicable(cve, queryVersion),
            `CVE ID ${cve.cveId} (Product: ${cve.productName}) must be vulnerable to version ${queryVersion} based on its productVersions array.`,
          ).to.be.true;
        });
      });

      it(`GET /api/cves?productName=dompurify&version=3.0.0&severityLevel=CRITICAL should return CVEs with specified product/version/severity`, async () => {
        const queryProductName = "dompurify";
        const queryVersion = "3.0.0";
        const querySeverityLevel = "CRITICAL";

        // helper function to check if a specific version falls within a CVE's version ranges
        const isVersionApplicable = (cve, targetVersion) => {
          // Must have productVersions to check applicability
          if (!cve.productVersions || cve.productVersions.length === 0) {
            return false;
          }

          // iterate through all version ranges for the CVE
          return cve.productVersions.some((range) => {
            const { start, end, s_type, e_type } = range;

            // Check Start Boundary (targetVersion compared to start)
            const startComparison = compareVersions(targetVersion, start);
            let meetsStartCondition = false;
            if (s_type === "i") {
              // inclusive
              meetsStartCondition = startComparison >= 0;
            } else if (s_type === "e") {
              // exclusive
              meetsStartCondition = startComparison > 0;
            } else {
              // Assume inclusive if type is missing or unknown for robustness
              meetsStartCondition = startComparison >= 0;
            }

            // Check End Boundary (targetVersion compared to end)
            const endComparison = compareVersions(targetVersion, end);
            let meetsEndCondition = false;
            if (e_type === "i") {
              // inclusive
              meetsEndCondition = endComparison <= 0;
            } else if (e_type === "e") {
              // exclusive
              meetsEndCondition = endComparison < 0;
            } else {
              // Assume inclusive if type is missing or unknown for robustness
              meetsEndCondition = endComparison <= 0;
            }

            // The version is applicable if it meets both start and end conditions
            return meetsStartCondition && meetsEndCondition;
          });
        };

        const response = await publicClient.get(
          `${baseUrl}/api/cves?productName=${queryProductName}&version=${queryVersion}&severityLevel=${querySeverityLevel}`,
        );

        // check HTTP Status
        expect(response.status).to.equal(SUCCESS_STATUS);

        const cves = response.data;

        // check that results were returned
        expect(cves)
          .to.be.an("array")
          .with.lengthOf.at.least(
            1,
            `Expected at least one CVE for product '${queryProductName}' applicable to version '${queryVersion}'`,
          );

        // iterate and check ALL filtering conditions
        cves.forEach((cve) => {
          // check productName includes the query string (case-insensitive)
          expect(cve.productName.toLowerCase()).to.include(
            queryProductName.toLowerCase(),
            `Product name '${cve.productName}' must include '${queryProductName}'`,
          );

          // check the version applicability filter was correctly applied by the server
          expect(
            isVersionApplicable(cve, queryVersion),
            `CVE ID ${cve.cveId} (Product: ${cve.productName}) must be vulnerable to version ${queryVersion} based on its productVersions array.`,
          ).to.be.true;

          expect(cve.severityLevel).to.equal(
            querySeverityLevel,
            `Severity level '${cve.severityLevel}' must be equal to '${querySeverityLevel}'`,
          );
        });
      });

      it(`GET /api/cves?productName=dompurify&version=3.0.0&publishedStart=2024-01-01 should filter by start date`, async () => {
        const queryProductName = "dompurify";
        const queryVersion = "3.0.0";
        const queryPublishedStart = "2024-09-01";
        const queryPublishedEnd = undefined; // no end date

        const response = await publicClient.get(
          `${baseUrl}/api/cves?productName=${queryProductName}&version=${queryVersion}&publishedStart=${queryPublishedStart}`,
        );

        expect(response.status).to.equal(SUCCESS_STATUS);

        const cves = response.data;

        expect(cves)
          .to.be.an("array")
          .with.lengthOf.at.least(
            1,
            `Expected results after applying publishedStart filter.`,
          );

        console.log(cves);
        cves.forEach((cve) => {
          // Check existing filters (Product, Version)
          expect(cve.productName.toLowerCase()).to.include(
            queryProductName.toLowerCase(),
          );
          expect(isVersionApplicable(cve, queryVersion)).to.be.true;

          // Check Date Filter
          expect(
            isDateWithinRange(cve, queryPublishedStart, queryPublishedEnd),
            `CVE ID ${cve.cveId} must be published on or after ${queryPublishedStart}`,
          ).to.be.true;
        });
      });

      it(`GET /api/cves?productName=dompurify&version=3.0.0&publishedEnd=2024-06-30 should filter by end date`, async () => {
        const queryProductName = "dompurify";
        const queryVersion = "3.0.0";
        const queryPublishedStart = undefined; // No start date
        const queryPublishedEnd = "2024-09-30";

        const response = await publicClient.get(
          `${baseUrl}/api/cves?productName=${queryProductName}&version=${queryVersion}&publishedEnd=${queryPublishedEnd}`,
        );

        expect(response.status).to.equal(SUCCESS_STATUS);

        const cves = response.data;

        expect(cves)
          .to.be.an("array")
          .with.lengthOf.at.least(
            1,
            `Expected results after applying publishedEnd filter.`,
          );

        cves.forEach((cve) => {
          // Check existing filters (Product, Version)
          expect(cve.productName.toLowerCase()).to.include(
            queryProductName.toLowerCase(),
          );
          expect(isVersionApplicable(cve, queryVersion)).to.be.true;

          // Check Date Filter
          expect(
            isDateWithinRange(cve, queryPublishedStart, queryPublishedEnd),
            `CVE ID ${cve.cveId} must be published on or before ${queryPublishedEnd}`,
          ).to.be.true;
        });
      });

      it(`GET /api/cves?productName=dompurify&version=3.0.0&publishedStart=2024-01-01&publishedEnd=2024-06-30 should filter by both start and end dates`, async () => {
        const queryProductName = "dompurify";
        const queryVersion = "3.0.0";
        const queryPublishedStart = "2024-09-01";
        const queryPublishedEnd = "2024-09-30";

        const response = await publicClient.get(
          `${baseUrl}/api/cves?productName=${queryProductName}&version=${queryVersion}&publishedStart=${queryPublishedStart}&publishedEnd=${queryPublishedEnd}`,
        );

        expect(response.status).to.equal(SUCCESS_STATUS);

        const cves = response.data;

        expect(cves)
          .to.be.an("array")
          .with.lengthOf.at.least(
            1,
            `Expected results after applying both date filters.`,
          );

        cves.forEach((cve) => {
          // Check existing filters (Product, Version)
          expect(cve.productName.toLowerCase()).to.include(
            queryProductName.toLowerCase(),
          );
          expect(isVersionApplicable(cve, queryVersion)).to.be.true;

          // Check Date Filter
          expect(
            isDateWithinRange(cve, queryPublishedStart, queryPublishedEnd),
            `CVE ID ${cve.cveId} must be published between ${queryPublishedStart} and ${queryPublishedEnd} (inclusive).`,
          ).to.be.true;
        });
      });
    });
  });
};

/**
 * Checks if a given port is currently in use (a server is running on it).
 * @param {number} port The port number to check.
 * @returns {Promise<boolean>} Resolves to true if the port is in use, false otherwise.
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    // triggered if the port is ALREADY BOUND (in use).
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        // port already in use
        resolve(true);
      } else {
        resolve(false); // Other errors treated as not-confirmed-in-use
      }
    });

    server.once("listening", () => {
      // port is open, close and return false
      server.close(() => resolve(false));
    });

    // attempt to connect to the port
    server.listen(port);
  });
}

describe("Full Security and CRUD Workflow Tests", function () {
  // skip tests if api key isn't set
  if (!VALID_API_KEY) {
    console.log(`[ERROR]: Skipping tests, invalid API KEY: ${VALID_API_KEY}`);
    return;
  }
  console.log("[INFO] Received a valid API key!");
  isPortInUse(PORT).then((inUse) => {
    if (!inUse) {
      console.log(
        `[WARNING]: Skipping tests on local server, port ${PORT} doesn't seem to be in use.`,
      );
    } else {
      runApiTests(LOCAL_URL_BASE, "LOCAL");
    }
  });
  // runApiTests(REMOTE_URL_BASE, "REMOTE");
});
