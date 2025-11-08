const express = require("express");
const mongoose = require("mongoose");
const CVE = require("./models/cve.model.js");
const app = express();
const cveRoute = require("./routes/cve.route.js");
const port = 3000;

// middleware to support sending json
app.use(express.json());

// routes
app.use("/api/cves", cveRoute);

// visible at root
app.get("/", (req, res) => {
  res.send("hello from node API");
});

// connection to real database
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
