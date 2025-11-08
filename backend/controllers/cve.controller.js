const { get } = require("mongoose");
const CVE = require("../models/cve.model.js");

// add some arbitrary CVE to the database
const createCVE = async (req, res) => {
  try {
    const cve = await CVE.create(req.body);
    console.log(req.body);
    res.status(200).json(cve);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all CVEs
const getCVEs = async (req, res) => {
  try {
    const cves = await CVE.find({});
    res.status(200).json(cves);
  } catch {
    res.status(500).json({ message: error.message });
  }
};

// get a CVE by its ID
const getCVE = async (req, res) => {
  try {
    const { id } = req.params;
    const cve = await CVE.findById(id);
    console.log(req.body);
    res.status(200).json(cve);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// update a CVE by
const updateCVE = async (req, res) => {
  try {
    const { id } = req.params;
    const cve = await CVE.findByIdAndUpdate(id, req.body);

    // error if trying to update non existent CVE
    if (!cve) {
      return res.status(404).json({ message: "CVE not found" });
    }

    // check for the updated CVE
    const updatedCVE = await CVE.findById(id);
    res.status(200).json(updatedCVE);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// delete a CVE by its ID
const deleteCVE = async (req, res) => {
  try {
    const { id } = req.params;
    const cve = await CVE.findByIdAndDelete(id);

    if (!cve) {
      // cve doesn't exist
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "CVE deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCVEs,
  getCVE,
  deleteCVE,
  createCVE,
  updateCVE,
};
