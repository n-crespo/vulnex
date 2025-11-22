import { Router } from "express";
import {
  getCVEs,
  getCVE,
  createCVE,
  updateCVE,
  deleteCVE,
  bulkDeleteCVEs,
  bulkUpdateCVEs,
} from "../controllers/cve.controller.js";

// import auth middleware
import authenticateWriteAccess from "../middleware/auth.middleware.js";

const router = Router();

// note: root URL ("/") = /api/cves

// --- public read access (get) ---

// GET /api/cves/?limit=X&skip=Y
// Allows fetching a limited, paginated list of CVEs.
router.get("/", getCVEs); // all CVEs
router.get("/:cveId", getCVE); // read by ID

// --- protected write access (post/put/delete) ---

// create a CVE
router.post("/", authenticateWriteAccess, createCVE);

// bulk update a CVE
router.put("/", authenticateWriteAccess, bulkUpdateCVEs);
// update a CVE by ID
router.put("/:cveId", authenticateWriteAccess, updateCVE);

// bulk delete CVEs
router.delete("/bulk-delete", authenticateWriteAccess, bulkDeleteCVEs);

// delete a CVE by ID
router.delete("/:cveId", authenticateWriteAccess, deleteCVE);

export default router;
