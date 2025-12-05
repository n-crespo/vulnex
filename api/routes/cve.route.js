import { Router } from "express";
import {
  getCVEs,
  getCVE,
  createCVE,
  // updateCVE,
  deleteCVE,
  bulkDeleteCVEs,
  bulkUpdateCVEs,
  bulkScanCVEs,
} from "../controllers/cve.controller.js";

// import auth middleware
import { requireWriteAccess } from "../middleware/auth.middleware.js";

const router = Router();

// note: root URL ("/") = /api/cves

// --- public read access (get) ---

// GET /api/cves/?limit=X&skip=Y
// Allows fetching a limited, paginated list of CVEs.
router.get("/", getCVEs); // all CVEs
router.get("/:cveId", getCVE); // read by ID

//  sending large JSON request as body
router.post("/bulk-scan", bulkScanCVEs);

// --- protected write access (post/put/delete) ---

// create a CVE
router.post("/", requireWriteAccess, createCVE);

// bulk update a CVE
router.put("/", requireWriteAccess, bulkUpdateCVEs);

// update a CVE by ID. Deprecated in favor of PUT to /api/cves (above)
// router.put("/:cveId", authenticateWriteAccess, updateCVE);

// bulk delete CVEs
router.delete("/bulk-delete", requireWriteAccess, bulkDeleteCVEs);

// delete a CVE by ID
router.delete("/:cveId", requireWriteAccess, deleteCVE);

export default router;
