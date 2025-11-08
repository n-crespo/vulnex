const express = require("express");
const router = express.Router();
const {
  getCVEs,
  getCVE,
  createCVE,
  updateCVE,
  deleteCVE,
} = require("../controllers/cve.controller.js");

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

module.exports = router;
