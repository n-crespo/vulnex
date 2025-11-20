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

// read CVEs from the db
router.get("/", getCVEs); // all CVEs
router.get("/:id", getCVE); // read by ID

// --- protected write access (post/put/delete) ---

// create a CVE
router.post("/", authenticateWriteAccess, createCVE);

// update a CVE by ID
router.put("/:id", authenticateWriteAccess, updateCVE);

// delete a CVE by ID
router.delete("/:id", authenticateWriteAccess, deleteCVE);

export default router;
