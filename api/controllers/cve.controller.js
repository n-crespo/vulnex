import CVE from "../models/cve.model.js";
import { filterCvesByVersion } from "../../utils/version_filter.js";

const CVE_SCHEMA_FIELDS = Object.keys(CVE.schema.paths).filter(
  // filter out Mongoose internal fields (_id, __v, etc )
  (path) => !path.startsWith("_") && path !== "id",
);
const ALLOWED_UPDATE_FIELDS = new Set(CVE_SCHEMA_FIELDS);

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
  console.log("--- [POST] Create CVE(s): ---");
  const records = req.body;
  try {
    let result;
    if (Array.isArray(records)) {
      console.log(`Attempting bulk insert of ${records.length} records.`);
      result = await CVE.insertMany(records, { ordered: true }); // ordered: true will stop insertion if any document fails
      res.status(200).json({
        message: `${result.length} CVE records created successfully (bulk operation).`,
        count: result.length,
        data: result,
      });
    } else {
      console.log("Attempting single record insert.");
      result = await CVE.create(records);
      res.status(200).json(result);
    }
  } catch (error) {
    console.log("Failed to create CVE(s): ", error.message);

    let statusCode = 500;
    let errorMessage = "An unexpected server error occurred.";

    if (error.name === "ValidationError") {
      statusCode = 400; // bad request (wrong type, failed regex)
      const validationMessages = Object.values(error.errors)
        .map((err) => `${err.path}: ${err.message}`)
        .join(", "); // Join them into a single string

      errorMessage = `Validation failed for the following fields: ${validationMessages}`;

      res.status(statusCode).json({
        message: "Failed to create CVE record due to invalid input data.",
        error: errorMessage,
      });
    } else if (error.code && error.code === 11000) {
      res.status(409).json({
        message: "Failed to process CVE creation(s)",
        error: `A record with a duplicate unique key (e.g., cveId) was found. Details: ${error.message}`,
      });
    } else {
      // other errors
      errorMessage = error.message;
      res.status(500).json({
        message: "Failed to process CVE creation(s)",
        error: errorMessage,
      });
    }
  }
};

/**
 * Fetch paginated CVEs via GET /api/cves/
 *
 * Query Params:
 *   limit: max number of CVEs to return (default: 100)
 *   skip:  offset from CVE 0 in db to start returning (default: 0)
 *   productName: filter results by a specific product name (e.g., 'dompurify') - case-insensitive substring match
 *   severityLevel: filter results by a specific severity level (e.g., 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW') - exact match
 *   version: filter results to only include CVEs applicable to this specific version (e.g., '1.0.1'). This filter is only applied if 'productName' is also provided.
 *   publishedStart: filter results to include only CVEs published on or after this date (e.g., '2023-01-01') - exact date match.
 *   publishedEnd: filter results to include only CVEs published on or before this date (e.g., '2023-12-31') - exact date match.
 *   keyword: filter results by a keyword within the CVE description (e.g., 'injection') - case-insensitive substring match.
 *
 * Response Headers:
 *   `X-Page-Count`: The number of CVEs returned in the current response body.
 *   `X-Total-Count`: The total number of documents found in the database matching ALL query filters (including version).
 *   `X-Initial-Offset`: The 'skip' value used for the query.
 *
 * Response JSON:
 * `[ { ... }, { ... } ] // array of requested CVEs`
 */
export const getCVEs = async (req, res) => {
  console.log(`--- [GET] Get CVEs ---`);
  try {
    // extract params from query string
    const limit = parseInt(req.query.limit) || 100; // Default limit to 100 records
    const skip = parseInt(req.query.skip) || 0; // Default skip to 0 (start from the beginning)

    const requestedProductName = req.query.productName;
    const requestedSeverityLevel = req.query.severityLevel;
    const requestedVersion = req.query.version;
    const requestedPublishedStart = req.query.publishedStart;
    const requestedPublishedEnd = req.query.publishedEnd;
    const requestedKeyword = req.query.keyword;

    // cves need manual filtering if version is specified. this also requires product name.
    const needsManualFiltering = requestedProductName && requestedVersion;

    // ensure non-negative parameters
    const safeLimit = Math.max(1, limit);
    const safeSkip = Math.max(0, skip);

    const queryFilter = {};
    const publishedFilter = {};

    // parse date range start filter
    if (requestedPublishedStart) {
      try {
        // Attempt to parse the date string (e.g., '2023-01-01')
        publishedFilter.$gte = new Date(requestedPublishedStart);
        console.log(`Filter: publishedStart=${requestedPublishedStart}`);
      } catch (e) {
        console.error("Invalid publishedStart date format.");
      }
    }

    // parse date range end filter
    if (requestedPublishedEnd) {
      try {
        // Attempt to parse the date string (e.g., '2023-12-31')
        publishedFilter.$lte = new Date(requestedPublishedEnd);
        console.log(`Filter: publishedEnd=${requestedPublishedEnd}`);
      } catch (e) {
        console.error("Invalid publishedEnd date format.");
      }
    }

    // apply constructed date filter to the main query filter if any part was set
    if (Object.keys(publishedFilter).length > 0) {
      queryFilter.published = publishedFilter;
      console.log(`Filter: published=${JSON.stringify(publishedFilter)}`);
    }

    // add product name filter
    if (requestedProductName) {
      queryFilter.productName = {
        $regex: new RegExp(requestedProductName),
        $options: "i", // case insensitive
      };
      console.log(`Filter: product=${requestedProductName}`);
    }

    if (requestedKeyword) {
      queryFilter.description = {
        $regex: new RegExp(requestedKeyword),
        $options: "i", // case insensitive
      };
      console.log(`Filter: keyword=${requestedKeyword}`);
    }

    // add severityLevel filter
    if (requestedSeverityLevel) {
      queryFilter.severityLevel = requestedSeverityLevel;
      console.log(`Filter: severity=${requestedSeverityLevel}`);
    }

    let totalCount;
    let cves = {};

    console.log(`Fetching CVEs: Limit=${safeLimit}, Skip=${safeSkip},`);

    if (needsManualFiltering) {
      console.log("In-memory filtering...");
      console.log(`Filter: version=${requestedVersion}`);

      let allFilteredCves = await CVE.find(queryFilter);
      allFilteredCves = filterCvesByVersion(allFilteredCves, requestedVersion);

      // header info (total matching cves)
      totalCount = allFilteredCves.length;

      // respect pagination request
      cves = allFilteredCves.slice(safeSkip, safeSkip + safeLimit);
    } else {
      // get total count with mongo function
      totalCount = await CVE.countDocuments(queryFilter);
      cves = await CVE.find(queryFilter).skip(safeSkip).limit(safeLimit);
    }

    // count CVEs we will return
    const pageCount = cves.length;

    console.log(
      `Query results: Total Count=${totalCount}, Page Count=${pageCount}`,
    );

    // build the headers
    res.header("X-Page-Count", pageCount);
    res.header("X-Total-Count", totalCount);
    res.header("X-Initial-Offset", skip);

    res.status(200).json(cves);
  } catch (error) {
    console.log("failed: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

/** Fetch one CVE by ID via GET /api/cves/:id
 * Response JSON:
 * `{ ... } // the requested CVE`
 */
export const getCVE = async (req, res) => {
  try {
    const { cveId } = req.params;
    console.log("--- [GET] Get CVE: ---", cveId);
    const cve = await CVE.findOne({ cveId: cveId });

    if (!cve) {
      console.log("Failed, CVE not found");
      return res.status(404).json({ message: "CVE not found" });
    }

    console.log("Getting CVE", cveId);
    res.status(200).json(cve);
  } catch (error) {
    console.log("Failed: ", error.message);
    return res.status(500).json({ message: error.message });
  }
};

/** Update one CVE by ID via POST /api/cves/:id.
 * @deprecated Use POST /api/cves instead.
 * Request Body:
 * `{ ... } // CVE info to update`
 * Response JSON:
 * `{ ... } // the state of the updated CVE`
 */
export const updateCVE = async (req, res) => {
  try {
    const { cveId } = req.params;
    console.log(
      `--- [PUT] Update CVE ${cveId} with ${JSON.stringify(req.body)} ---`,
    );
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
};

/** Bulk update CVEs via PUT /api/cves/
 * Request body: `[ { cveId: "ID-1", update: { severity: "LOW" } }, { cveId: "ID-2", update: { severity: "LOW" } } ]`
 * Response JSON:
 * ```
 * {
 *   message: "Success Message",
 *   matchedCount: 2, // Number of CVEs found and attempted to update
 *   modifiedCount: 2 // Number of CVEs successfully modified
 *   errors: [...] // an optional array of collected errors
 * }
 * ```
 */
export const bulkUpdateCVEs = async (req, res) => {
  const updates = req.body;
  console.log(
    `--- [PUT] Bulk Update CVEs: ${updates ? updates.length : 0} records ---`,
  );

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      message: "Request body must contain a non-empty array of update objects.",
    });
  }

  // Array to collect detailed errors for the user
  const errors = [];

  // Convert array of updates into an array of mongodb bulkwrite operations
  const bulkOperations = updates
    .map((item, index) => {
      // validate basic structure
      if (
        !item.cveId ||
        !item.update ||
        typeof item.update !== "object" ||
        Object.keys(item.update).length === 0
      ) {
        errors.push({
          index,
          cveId: item.cveId || "N/A",
          message: "Missing 'cveId' or empty 'update' object.",
        });
        return null; // Will be filtered out
      }

      // filter out unauthorized fields
      const filteredUpdate = {};
      const receivedFields = Object.keys(item.update);
      const invalidFields = [];

      receivedFields.forEach((key) => {
        if (ALLOWED_UPDATE_FIELDS.has(key)) {
          filteredUpdate[key] = item.update[key];
        } else {
          invalidFields.push(key);
        }
      });

      // collect errors for invalid fields
      if (invalidFields.length > 0) {
        errors.push({
          index,
          cveId: item.cveId,
          message: `Update skipped invalid field(s): ${invalidFields.join(", ")}.`,
          skippedFields: invalidFields,
        });
      }

      // skip operation if no valid fields remain after filtering
      if (Object.keys(filteredUpdate).length === 0) {
        return null;
      }

      return {
        updateOne: {
          filter: { cveId: item.cveId },
          // filteredUpdate object is guaranteed to only contain $set-able fields
          update: { $set: filteredUpdate },
        },
      };
    })
    .filter((op) => op !== null); // Filter out invalid/empty operations

  if (bulkOperations.length === 0 && errors.length > 0) {
    // If we only had operations that were entirely invalid (all filtered out)
    return res.status(400).json({
      message: "No valid update operations were found. See errors for details.",
      errors: errors,
    });
  } else if (bulkOperations.length === 0) {
    return res.status(400).json({
      message: "No valid update operations found in the request body.",
    });
  }

  try {
    const result = await CVE.bulkWrite(bulkOperations);

    console.log(`Successfully updated ${result.modifiedCount} CVEs`);
    res.status(200).json({
      message: `${result.matchedCount} CVEs matched, ${result.modifiedCount} CVEs successfully modified.`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      errors: errors, // collected errors
    });
  } catch (error) {
    console.error("Database error during bulk update.", error);
    return res.status(500).json({
      message: "Internal server error during bulk update.",
      error: error.message,
    });
  }
};

/** Delete one CVE by ID via DELETE /api/cves/:id
 * Response JSON:
 * `{ message: "Success message" }`
 */
export const deleteCVE = async (req, res) => {
  console.log(`--- [DELETE] Delete CVE: ${JSON.stringify(req.params)} ---`);
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
};

/** Bulk delete CVEs via DELETE /api/cves/
 * Request body: `{ "cveIds": ["CVE-ID-1", "CVE-ID-2", ...] }`
 * Response JSON:
 * ```
 *   {
 *     message: "Success Message"
 *     deletedCount: 2 // Number of CVEs successfully deleted
 *     requestedCount: 2 // Number of CVEs requested for deletion
 *   }
 * ```
 */
export const bulkDeleteCVEs = async (req, res) => {
  const { cveIds } = req.body;
  console.log(cveIds);
  console.log(
    `--- [DELETE] Bulk Delete CVEs: ${cveIds ? cveIds.length : 0} IDs ---`,
  );

  if (!Array.isArray(cveIds) || cveIds.length === 0) {
    return res.status(400).json({
      message: "Request body must contain a non-empty array of 'cveIds'.",
    });
  }

  try {
    // use $in to match all provided IDs
    const result = await CVE.deleteMany({
      cveId: { $in: cveIds },
    });

    if (result.deletedCount === 0) {
      console.log("No matching CVEs found for deletion.");
      return res
        .status(404)
        .json({ message: "No matching CVEs found for deletion." });
    }

    res.status(200).json({
      message: `${result.deletedCount} CVEs deleted successfully.`,
      deletedCount: result.deletedCount,
      requestedCount: cveIds.length,
    });
  } catch (error) {
    console.log("Failed to bulk delete CVEs: ", error.message);
    return res.status(500).json({
      message: "Internal server error during bulk deletion.",
      error: error.message,
    });
  }
};

/**
 * Bulk Scan CVEs via POST /api/cves/bulk-scan
 * Used by the frontend to check a list of dependencies against the database.
 * Request Body:
 * ```
 * {
 *   "dependencies": [
 *     { "name": "react", "version": "18.2.0" },
 *     { "name": "express", "version": "4.17.1" }
 *   ]
 * }
 * ```
 * Response JSON:
 * ```
 * [
 *   {
 *     "package": "react",
 *     "version": "18.2.0",
 *     "cves": [ ... ] // List of matching CVE objects
 *   },
 * ...
 * ]
 */
export const bulkScanCVEs = async (req, res) => {
  const { dependencies } = req.body;
  console.log(
    `--- [POST] Bulk Scan: ${dependencies ? dependencies.length : 0} items ---`,
  );

  if (!dependencies || !Array.isArray(dependencies)) {
    return res
      .status(400)
      .json({ message: "Invalid payload. 'dependencies' must be an array." });
  }

  if (dependencies.length === 0) {
    return res.status(200).json([]);
  }

  try {
    // use a Set to avoid querying "react" twice if it appears twice
    const uniqueNames = [...new Set(dependencies.map((d) => d.name))];

    // case-insensitive exact match
    const regexList = uniqueNames.map((name) => {
      // Escape special regex characters to prevent crashing on names like "c++"
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`^${escapedName}$`, "i");
    });

    // fetch all matches
    // .lean() converts Mongoose docs to plain JS objects (faster for read-only)
    const allCandidates = await CVE.find({
      productName: { $in: regexList },
    }).lean();

    console.log(
      `Database found ${allCandidates.length} potential CVE matches for these products.`,
    );

    // filter candidates by version for each dependency
    const results = dependencies.map((dep) => {
      const productCandidates = allCandidates.filter(
        (cve) => cve.productName.toLowerCase() === dep.name.toLowerCase(),
      );

      const confirmedCVEs = filterCvesByVersion(productCandidates, dep.version);

      return {
        package: dep.name,
        version: dep.version,
        cves: confirmedCVEs,
      };
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Bulk scan failed:", error);
    res
      .status(500)
      .json({ message: "Internal server error during bulk scan." });
  }
};
