import express, { json } from "express";
import cors from "cors"; // needed so the github pages can talk to Azure on the backend
import { connect } from "mongoose";
import cveRoute from "./routes/cve.route.js";
import userRoute from "./routes/userRegisterLogin.route.js";

const app = express();

const port = process.env.PORT || 3000;
const MONGO_DB_URI = process.env.MONGO_DB_URI;

// cors middleware is needed for "cross-origin requests"/frontend-backend comms
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://n-crespo.github.io"
  ],
  credentials: true
}));

// middleware to support sending json
app.use(json({ limit: "50mb" }));

// routes
app.use("/api/cves", cveRoute);
app.use("/api/users", userRoute);

// visible at root
app.get("/", (req, res) => {
  console.log("[GET] Fetching root /\n--------------------");
  res.send("hello from node API");
});

// connection to real database
connect(MONGO_DB_URI)
  .then(() => {
    console.log("connected to the db!");
    app.listen(port, () => {
      console.log(`Server running on port ${port}\n--------------------`);
    });
  })
  .catch(() => {
    console.log("Connection failed");
  });
