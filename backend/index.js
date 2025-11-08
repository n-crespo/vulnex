import express, { json } from "express";
import { connect } from "mongoose";
import CVE from "./models/cve.model.js";
const app = express();
import cveRoute from "./routes/cve.route.js";
const port = process.env.PORT || 3000;

// middleware to support sending json
app.use(json());

// routes
app.use("/api/cves", cveRoute);

// visible at root
app.get("/", (req, res) => {
  res.send("hello from node API");
});

// connection to real database
connect(
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
