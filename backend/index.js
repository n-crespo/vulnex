const express = require("express");
const mongoose = require("mongoose");
const app = express();

// middleware to support sending json
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("hello from node API");
});

app.post("/api/cves", (req, res) => {
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
