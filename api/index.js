import express, { json } from "express";
const app = express();

import { connect } from "mongoose";
import cveRoute from "./routes/cve.route.js";

const port = process.env.PORT || 3000;
const MONGO_DB_URI = process.env.MONGO_DB_URI;

// middleware to support sending json
app.use(json());

// routes
app.use("/api/cves", cveRoute);

// visible at root
app.get("/", (req, res) => {
  res.send("hello from node API");
});

// connection to real database
connect(MONGO_DB_URI)
  .then(() => {
    console.log("connected to the db!");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(() => {
    console.log("Connection failed");
  });
