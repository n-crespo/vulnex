import { Router } from "express";
import {
  getCVEs,
  getCVE,
  createCVE,
  updateCVE,
  deleteCVE,
} from "../controllers/cve.controller.js";

const router = Router();

// note: root URL ("/") = /api/cves

// read CVEs from the db
router.get("/", getCVEs); // all CVEs
router.get("/:id", getCVE); // read by ID

// create a CVE
router.post("/", createCVE);

// update a CVE by ID
router.put("/:id", updateCVE);

// delete a CVE by ID
router.delete("/:id", deleteCVE);

export default router;
