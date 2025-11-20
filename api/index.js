import express, { json } from "express";
import { connect } from "mongoose";
import cveRoute from "./routes/cve.route.js";

const app = express();

const port = process.env.PORT || 3000;
const API_SECRET_KEY = process.env.API_SECRET_KEY || null;

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
