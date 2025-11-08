const express = require("express");
const router = express.Router();
const {
  getCVEs,
  getCVE,
  createCVE,
  updateCVE,
  deleteCVE,
} = require("../controllers/cve.controller.js");

// root URL = /api/cves
router.get("/", getCVEs);
router.get("/:id", getCVE);
router.post("/", createCVE);
router.put("/:id", updateCVE);
router.delete("/:id", deleteCVE);

module.exports = router;
