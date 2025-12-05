// bring in router from express and the new/returning user controllers
import { Router } from "express";
import {
  newUserRegister,
  returningUserLogin,
  getLoggedInUser,
  getFoundCVEs,
  addFoundCVE,
  getSavedCVEs,
  addSavedCVE,
  removeSavedCVE,
} from "../controllers/newUserLogin.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // Import the protection middleware

// create a router
const router = Router();

// list the routes for login/register
router.post("/register", newUserRegister);
router.post("/login", returningUserLogin);

// protected user routes

// GET /me - Retrieve primary user data
router.get("/me", protect, getLoggedInUser);

// GET /me/foundCVEs - Retrieve the list of uploaded/found CVE data
router.get("/me/foundCVEs", protect, getFoundCVEs);
// POST /me/foundCVEs - Add a new entry to the found CVEs list (with timestamp/filename)
router.post("/me/foundCVEs", protect, addFoundCVE);

// GET /me/savedCVEs - Retrieve the list of bookmarked/saved CVE IDs
router.get("/me/savedCVEs", protect, getSavedCVEs);
// POST /me/savedCVEs - Add a single CVE ID to the saved CVEs list
router.post("/me/savedCVEs", protect, addSavedCVE);
router.delete("/me/savedCVEs", protect, removeSavedCVE);

export default router;
