import CVE from "../models/cve.model.js";

function finish() {
  console.log("--------------------");
}

/**
 * Create a CVE(s) via POST /api/cves/
 * Request Body:
 *   `{ ... } // one CVE record`
 * Response JSON:
 *   `{ ... } // the newly created CVE record`
 *
 * OR
 *
 * Request Body:
 *   `[ { ... } { ... } ] // an array of CVEs to add`
 * Response JSON:
 * ```
 *   {
 *     message: // success message
 *     count: // number of records created
 *     data: [ { ... }, { ... } ] // array of newly created CVE records
 *   }
 *```
 */
export const createCVE = async (req, res) => {
  console.log("[POST] Creating CVE: ");
  console.log(req.body);
  try {
    const cve = await CVE.create(req.body);
    res.status(200).json(cve);
  } catch (error) {
    console.log("failed: ", error.message);

    // Check for MongoDB Duplicate Key Error (Code 11000)
    if (error.code === 11000) {
      // NOTE: this assumes that the cveId is the only unique key of a CVE record
      const value = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[value];
      const message = `A CVE with the ID: '${duplicateValue}' already exists. ${error.message}`;
      return res.status(409).json({
        message: message,
      });
    }

    const errorMessage = `${error.code}: ${error.message}`;
    res.status(500).json({ message: errorMessage });
  }
  finish();
};

/**
 * Fetch paginated CVEs via GET /api/cves/
 * Query Params:
 *   limit: max number of CVEs to return
 *   skip:  offset from CVE 0 in db to start returning
 * Response JSON:
 * `[ { ... }, { ... } ] // array of requested CVEs`
 */
export const getCVEs = async (req, res) => {
  console.log(`[GET] Getting CVEs`);
  try {
    // extract params from query string
    const limit = parseInt(req.query.limit) || 100; // Default limit to 100 records
    const skip = parseInt(req.query.skip) || 0; // Default skip to 0 (start from the beginning)

    // ensure non-negative parameters
    const safeLimit = Math.max(1, limit);
    const safeSkip = Math.max(0, skip);

    console.log(`Fetching CVEs: Limit=${safeLimit}, Skip=${safeSkip}`);
    // skip: offset, limit: page size
    const cves = await CVE.find({}).skip(safeSkip).limit(safeLimit);

    // send the total count for easier pagination
    const totalCount = await CVE.countDocuments({});
    res.header("X-Total-Count", totalCount);
    res.header("X-Initial-Offset", skip);
    res.status(200).json(cves);
  } catch (error) {
    console.log("failed: ", error.message);
    res.status(500).json({ message: error.message });
  }
  finish();
};

/** Fetch one CVE by ID via GET /api/cves/:id
 * Response JSON:
 * `{ ... } // the requested CVE`
 */
export const getCVE = async (req, res) => {
  try {
    const { cveId } = req.params;
    console.log("[GET] Getting CVE: ", cveId);
    const cve = await CVE.findOne({ cveId: cveId });

    if (!cve) {
      console.log("Failed, CVE not found");
      return res.status(404).json({ message: "CVE not found" });
    }

    console.log("Getting CVE", cveId);
    console.log(cve);
    res.status(200).json(cve);
  } catch (error) {
    console.log("Failed: ", error.message);
    return res.status(500).json({ message: error.message });
  }
  finish();
};

/** Update one CVE by ID via POST /api/cves/:id
 * Request Body:
 * `{ ... } // CVE info to update`
 * Response JSON:
 * `{ ... } // the state of the updated CVE`
 */
export const updateCVE = async (req, res) => {
  try {
    const { cveId } = req.params;
    console.log(`[PUT] Updating CVE ${cveId} with ${JSON.stringify(req.body)}`);
    const cve = await CVE.findOneAndUpdate({ cveId: cveId }, req.body);

    // error if trying to update non existent CVE
    if (!cve) {
      console.log("Failed, CVE not found");
      return res.status(404).json({ message: "CVE not found" });
    }

    // check for the updated CVE
    const updatedCVE = await CVE.findOne({ cveId: cveId });
    res.status(200).json(updatedCVE);
  } catch (error) {
    console.log("Failed: ", error.message);
    return res.status(500).json({ message: error.message });
  }
  finish();
};

/** Delete one CVE by ID via DELETE /api/cves/:id
 * Response JSON:
 * `{ message: "Success message" }`
 */
export const deleteCVE = async (req, res) => {
  console.log(`[DELETE] Deleting CVE: ${JSON.stringify(req.params)}`);
  try {
    const { cveId } = req.params;
    const cve = await CVE.findOneAndDelete({ cveId: cveId });

    if (!cve) {
      // cve doesn't exist
      console.log("Failed, CVE not found");
      return res.status(404).json({ message: "CVE not found" });
    }

    res.status(200).json({ message: "CVE deleted successfully" });
  } catch (error) {
    console.log("Failed: ", error.message);
    return res.status(500).json({ message: error.message });
  }
  finish();
};

/** Bulk delete CVEs via DELETE /api/cves/
 * Request body: `{ cveIds: [array of CVE IDs] }`
 * Response JSON:
 * ```
 *   {
 *     message: "Success Message"
 *     deletedCount: 2 // Number of CVEs successfully deleted
 *     requestedCount: 2 // Number of CVEs requested for deletion
 *   }
 * ```
 */
