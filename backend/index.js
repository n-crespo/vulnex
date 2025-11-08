const express = require("express");
const mongoose = require("mongoose");
const CVE = require("./models/cve.model.js");
const app = express();

// middleware to support sending json
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("hello from node API");
});

app.get("/api/cves", async (req, res) => {
  try {
    const cves = await CVE.find({});
    res.status(200).json(cves);
  } catch {
    res.status(500).json({ message: error.message });
  }
});

// allow searching for a CVE with some id
app.get("/api/cve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cve = await CVE.findById(id);
    res.status(200).json(cve);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  console.log(req.body);
  res.send(req.body);
});

// add to the database
app.post("/api/cves", async (req, res) => {
  try {
    const cve = await CVE.create(req.body);
    res.status(200).json(cve);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  console.log(req.body);
  res.send(req.body);
});

mongoose
  .connect(
    "***REMOVED***",
  )
  .then(() => {
    console.log("connected to the db!");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(() => {
    console.log("Connection failed");
  });
