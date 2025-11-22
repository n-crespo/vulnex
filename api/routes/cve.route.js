import { Router } from "express";
import {
  getCVEs,
  getCVE,
  createCVE,
  updateCVE,
  deleteCVE,
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

// update a CVE by ID
router.put("/:cveId", authenticateWriteAccess, updateCVE);

// delete a CVE by ID
router.delete("/:cveId", authenticateWriteAccess, deleteCVE);

export default router;
