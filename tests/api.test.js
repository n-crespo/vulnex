import { expect } from "chai";
import axios from "axios";
import net from "net";

const PORT = process.env.PORT || 3000;
const LOCAL_URL_BASE = `http://localhost:${PORT}`;
const REMOTE_URL_BASE = `https://vulnex-api.onrender.com`;
const VALID_API_KEY = process.env.API_SECRET_KEY;

if (!VALID_API_KEY) {
  console.error(
    "CRITICAL ERROR: API_SECRET_KEY is not defined in process.env. Tests requiring authentication will fail.",
  );
}

// create a string based on timestamp to use as primary key (must be unique)
const uniqueTimestampString = new Date().getTime().toString(36);

// Sample data for the test record
const testCveData = {
  cveId: uniqueTimestampString,
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

/**
 * Executes the full CRUD and security check sequence for a given base URL.
 * @param {string} baseUrl - The base URL of the server (e.g., http://localhost:3000)
 * @param {string} environmentName - A friendly name for the test block (e.g., 'LOCAL')
 */
const runSecurityTests = (baseUrl, environmentName) => {
  // The specific API endpoint used for CVE operations
  const apiEndpoint = `${baseUrl}/api/cves`;
  let createdCveId = null; // will use in tests later to verify cve creation

  // Axios clients scoped to the API endpoint (e.g., http://localhost:3000/api/cves)
  const publicClient = axios.create({
    baseURL: apiEndpoint,
    "Content-Type": "application/json",
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

      // NOTE: Expecting 200 based on your controller implementation
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property("_id");
      createdCveId = response.data._id; // Store ID for subsequent tests
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
      // Check that the returned object contains the update
      expect(response.data.isVulnerable).to.equal(false);
    });

    it(`GET /api/cves/:id should verify the update ("CRITICAL") (200 OK)`, async () => {
      const response = await publicClient.get(`/${createdCveId}`);
      expect(response.status).to.equal(200);
      expect(response.data.isVulnerable).to.equal(false);
    });

    // ABOVE IS PASSING!

    // --- PROTECTED DELETE TESTS ---

    it(`DELETE /api/cves/:id should FAIL without API Key (401/403 Forbidden)`, async () => {
      let errorStatus;
      try {
        await publicClient.delete(`/${createdCveId}`);
      } catch (error) {
        errorStatus = error.response.status;
      }
      // Verify security failure
      expect([401, 403]).to.include(errorStatus);
    });

    it(`DELETE /api/cves/:id should PASS WITH API Key (200 OK)`, async () => {
      const response = await protectedClient.delete(`/${createdCveId}`);
      expect(response.status).to.equal(200);
      // Check the message from the delete controller
      expect(response.data.message).to.equal("CVE deleted successfully");
    });

    it(`GET /api/cves/:id should FAIL after deletion (404 Not Found)`, async () => {
      let errorStatus;
      try {
        await publicClient.get(`/${createdCveId}`);
      } catch (error) {
        errorStatus = error.response.status;
      }
      // Verification: The controller should return 404 when not found
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
  isPortInUse(PORT).then((inUse) => {
    if (inUse) {
      runSecurityTests(LOCAL_URL_BASE, "LOCAL");
    } else {
      console.log(
        `[WARNING]: Skipping tests on local server, port ${PORT} doesn't seem to be in use.`,
      );
    }
  });
  runSecurityTests(REMOTE_URL_BASE, "REMOTE");
});
