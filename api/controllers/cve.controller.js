import CVE from "../models/cve.model.js";

function finish() {
  console.log("--------------------");
}

// add some arbitrary CVE to the database
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

// get all CVEs
export const getCVEs = async (req, res) => {
  console.log(`[GET] Getting all CVEs`);
  try {
    const cves = await CVE.find({});
    res.status(200).json(cves);
  } catch {
    console.log("failed: ", error.message);
    res.status(500).json({ message: error.message });
  }
  finish();
};

// get a CVE by its ID
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
    console.log("failed: ", error.message);
    return res.status(500).json({ message: error.message });
  }
  finish();
};

// update a CVE by
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
    console.log("failed: ", error.message);
    return res.status(500).json({ message: error.message });
  }
  finish();
};

// delete a CVE by its ID
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
    console.log("failed: ", error.message);
    return res.status(500).json({ message: error.message });
  }
  finish();
};
