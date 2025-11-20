import CVE from "../models/cve.model.js";

function finish() {
  console.log("--------------------");
}

// add some arbitrary CVE to the database
export const createCVE = async (req, res) => {
  console.log(`Creating CVE: ${JSON.stringify(req.body)}`);
  try {
    const cve = await CVE.create(req.body);
    res.status(200).json(cve);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
  finish();
};

// get all CVEs
export const getCVEs = async (req, res) => {
  console.log(`Getting all CVEs`);
  try {
    const cves = await CVE.find({});
    res.status(200).json(cves);
  } catch {
    res.status(500).json({ message: error.message });
  }
  finish();
};

// get a CVE by its ID
export const getCVE = async (req, res) => {
  console.log(`Getting CVE: ${JSON.stringify(req.params)}`);
  try {
    const { id } = req.params;
    const cve = await CVE.findById(id);

    if (!cve) {
      console.log("Failed");
      return res.status(404).json({ message: "CVE not found" });
    }

    res.status(200).json(cve);
  } catch (error) {
    console.log("failed");
    return res.status(500).json({ message: error.message });
  }
  finish();
};

// update a CVE by
export const updateCVE = async (req, res) => {
  console.log(`Updating CVE: ${JSON.stringify(req.body)}`);
  try {
    const { id } = req.params;
    const cve = await CVE.findByIdAndUpdate(id, req.body);

    // error if trying to update non existent CVE
    if (!cve) {
      console.log("Failed");
      return res.status(404).json({ message: "CVE not found" });
    }

    // check for the updated CVE
    const updatedCVE = await CVE.findById(id);
    res.status(200).json(updatedCVE);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  finish();
};

// delete a CVE by its ID
export const deleteCVE = async (req, res) => {
  console.log(`Deleting CVE: ${JSON.stringify(req.params)}`);
  try {
    const { id } = req.params;
    const cve = await CVE.findByIdAndDelete(id);

    if (!cve) {
      // cve doesn't exist
      console.log("Failed");
      return res.status(404).json({ message: "CVE not found" });
    }

    res.status(200).json({ message: "CVE deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  finish();
};
