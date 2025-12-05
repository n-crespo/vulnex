// bring in router from express and the new/returning user controllers
import { Router } from "express";
import {
  createUser,
  loginUser,
  getLoggedInUser,
  getFoundCVEs,
  addFoundCVE,
  getSavedCVEs,
  addSavedCVE,
  removeSavedCVE,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js"; // Import the protection middleware

// create a router
const router = Router();

// list the routes for login/register
router.post("/register", createUser);
router.post("/login", loginUser);

// protected user routes

// GET /me - Retrieve primary user data
router.get("/me", requireAuth, getLoggedInUser);

// GET /me/foundCVEs - Retrieve the list of uploaded/found CVE data
router.get("/me/foundCVEs", requireAuth, getFoundCVEs);
// POST /me/foundCVEs - Add a new entry to the found CVEs list (with timestamp/filename)
router.post("/me/foundCVEs", requireAuth, addFoundCVE);

// GET /me/savedCVEs - Retrieve the list of bookmarked/saved CVE IDs
router.get("/me/savedCVEs", requireAuth, getSavedCVEs);
// POST /me/savedCVEs - Add a single CVE ID to the saved CVEs list
router.post("/me/savedCVEs", requireAuth, addSavedCVE);
router.delete("/me/savedCVEs", requireAuth, removeSavedCVE);

export default router;
