import { expect } from "chai";
import axios from "axios";
import net from "net";

const PORT = process.env.PORT || 3000;
const LOCAL_URL_BASE = `http://localhost:${PORT}`;
const REMOTE_URL_BASE = `https://vulnex-api.onrender.com`;
const VALID_API_KEY = process.env.API_SECRET_KEY;

// Sample data for the test record
const testCveData = {
  cveId: "CVE-2029-2029",
  published: "2025-11-20T02:20:46",
  lastModified: "2025-11-20T02:20:50",
  status: "Deferred",
  description: "This is a CVE created for testing!",
  baseSeverityScore: 10,
  isVulnerable: true,
  cpeId: "cpe:2.3:a:eric_allman:sendmail:5.58:*:*:*:*:*:*:*",
};

// Data for the update operation
const updateCveData = {
  isVulnerable: false,
};

// Sample data for bulk actions
const bulkCveData = [
  {
    cveId: "TEST-2029-001",
    published: "2025-11-21T00:00:00",
    lastModified: "2025-11-21T00:00:00",
    status: "Analyzed",
    description: "Bulk Test CVE 1",
    baseSeverityScore: 5,
    isVulnerable: true,
    cpeId: "cpe:2.3:a:vendor:product:1.0:*:*:*:*:*:*:*",
  },
  {
    cveId: "TEST-2029-002",
    published: "2025-11-21T00:00:00",
    lastModified: "2025-11-21T00:00:00",
    status: "Analyzed",
    description: "Bulk Test CVE 2",
    baseSeverityScore: 7,
    isVulnerable: false,
    cpeId: "cpe:2.3:a:vendor:product:2.0:*:*:*:*:*:*:*",
  },
];

const bulkCveIds = { cveIds: bulkCveData.map((cve) => cve.cveId) };

/**
 * Executes the full CRUD and security check sequence for a given base URL.
 * @param {string} baseUrl - The base URL of the server (e.g., http://localhost:3000)
 * @param {string} environmentName - A friendly name for the test block (e.g., 'LOCAL')
 */
const runSecurityTests = (baseUrl, environmentName) => {
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

  describe(`\n---------------------------------\n| ${environmentName} SERVER TESTS | (${baseUrl})`, function () {
    this.timeout(15000); // Extended timeout for remote server

    // --- PUBLIC READ ACCESS TESTS ---

    it(`GET / should allow PUBLIC access to the root ("/") (200 OK)`, async () => {
      const response = await axios.get(baseUrl);
      expect(response.status).to.equal(200);
      expect(response.data).to.include("hello from node API");
    });

    it(`GET /api/cves should allow PUBLIC access to all CVEs (200 OK and array)`, async () => {
      const response = await publicClient.get("/");
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an("array");
    });

    // --- PROTECTED POST (CREATE) TESTS ---

    it(`POST /api/cves should FAIL without API Key (401/403 Forbidden)`, async () => {
      let errorStatus;
      try {
        await publicClient.post("/", testCveData);
      } catch (error) {
        errorStatus = error.response.status;
      }
      // Verify security failure
      expect([401, 403]).to.include(errorStatus);
    });

    it(`POST /api/cves should PASS WITH API Key and return the created CVE (200 OK)`, async () => {
      const response = await protectedClient.post("/", testCveData);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property("cveId");
      createdCveId = response.data.cveId; // Store ID for later tests
    });

    it(`GET /api/cves/:id should allow PUBLIC access to the newly created CVE (200 OK)`, async () => {
      const response = await publicClient.get(`/${createdCveId}`);
      expect(response.status).to.equal(200);
      expect(response.data.cveId).to.equal(testCveData.cveId);
    });

    // --- PROTECTED PUT (UPDATE) TESTS ---

    it(`PUT /api/cves/:id should FAIL without API Key (401/403 Forbidden)`, async () => {
      let errorStatus;
      try {
        await publicClient.put(`/${createdCveId}`, updateCveData);
      } catch (error) {
        errorStatus = error.response.status;
      }
      // Verify security failure
      expect([401, 403]).to.include(errorStatus);
    });

    it(`PUT /api/cves/:id should PASS WITH API Key and update the CVE (200 OK)`, async () => {
      const response = await protectedClient.put(
        `/${createdCveId}`,
        updateCveData,
      );
      // NOTE: Expecting 200, and the controller returns the updated CVE body
      expect(response.status).to.equal(200);
      // Check that returned object contains the update
      expect(response.data.isVulnerable).to.equal(false);
    });

    it(`GET /api/cves/:id should verify the update ("CRITICAL") (200 OK)`, async () => {
      const response = await publicClient.get(`/${createdCveId}`);
      expect(response.status).to.equal(200);
      expect(response.data.isVulnerable).to.equal(false);
    });

    // --- PROTECTED DELETE TESTS ---

    it(`DELETE /api/cves/:id should FAIL without API Key (401/403 Forbidden)`, async () => {
      let errorStatus;
      try {
        await publicClient.delete(`/${createdCveId}`);
      } catch (error) {
        errorStatus = error.response.status;
      }
      // verify security failure
      expect([401, 403]).to.include(errorStatus);
    });

    it(`DELETE /api/cves/:id should PASS WITH API Key (200 OK)`, async () => {
      const response = await protectedClient.delete(`/${testCveData.cveId}`);
      expect(response.status).to.equal(200);
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
      expect(errorStatus).to.equal(404);
    });

    // --- BULK OPERATIONS ---

    it(`POST (bulk) /api/cves should PASS WITH API Key and create multiple CVEs (200 OK)`, async () => {
      const response = await protectedClient.post("/", bulkCveData);
      expect(response.status).to.equal(200);
      expect(response.data.data).to.be.an("array");
      expect(response.data.count).to.equal(bulkCveData.length); // Verify creation of a specific CVE from the bulk operation
      expect(
        response.data.data.some((cve) => cve.cveId === bulkCveIds.cveIds[0]),
      ).to.be.true;
    });

    it(`GET /api/cves/:id should allow PUBLIC access to a bulk created CVE (${bulkCveIds.cveIds[0]})`, async () => {
      const response = await publicClient.get(`/${bulkCveIds.cveIds[0]}`);
      expect(response.status).to.equal(200);
      expect(response.data.cveId).to.equal(bulkCveIds.cveIds[0]);
    });

    // --- PROTECTED DELETE (BULK DELETE) TESTS ---

    it(`DELETE /api/cves/bulk-delete should FAIL without API Key (401/403 Forbidden)`, async () => {
      let errorStatus;
      try {
        await publicClient.delete(`/bulk-delete`, { data: bulkCveIds }); // axios delete with body uses `data` config
      } catch (error) {
        errorStatus = error.response.status;
      } // Verify security failure
      expect([401, 403]).to.include(errorStatus);
    });

    it(`DELETE /api/cves should PASS WITH API Key and delete multiple CVEs (200 OK)`, async () => {
      // Pass the array of IDs in the request body for bulk delete
      const response = await protectedClient.delete(`/bulk-delete`, {
        data: bulkCveIds, // Array of cveIds: ["CVE-BULK-2029-001", "CVE-BULK-2029-002"]
      });
      expect(response.status).to.equal(200); // Assuming controller returns count or a success message
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
      expect(errorStatus).to.equal(404);
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
      runSecurityTests(LOCAL_URL_BASE, "LOCAL");
    }
  });
  // runSecurityTests(REMOTE_URL_BASE, "REMOTE");
});
