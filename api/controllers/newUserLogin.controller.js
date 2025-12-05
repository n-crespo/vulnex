import newUserLoginModel from "../models/newUserLogin.model.js";
import jwt from "jsonwebtoken";

// this secret is for signing JWT tokens and should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
}

// this is the main controller for new user registration
export const newUserRegister = async (req, res) => {
  try {
    // get the email and password from the body of the request
    const { email, password } = req.body;

    // make sure both fields were provided before auth
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // if email and password were given, ensure this email isn't already in use:
    const isUserEmailExisting = await newUserLoginModel.findOne({ email });
    if (isUserEmailExisting) {
      return res.status(409).json({ message: "User already exists" });
    }
    // if password exists and email is unique, save the new user info the the database
    const newUserReg = new newUserLoginModel({ email, passwordHash: password });
    await newUserReg.save();
    res.status(201).json({ message: "Successful new user registration" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "New user registration failed...API/developer issue." });
  }
};

// main controller for returning user logins
export const returningUserLogin = async (req, res) => {
  try {
    // email and password will be in the user's request body
    const { email, password } = req.body;

    // check if the email was provided
    const returningUserEmailProvided = await newUserLoginModel.findOne({
      email,
    });
    if (!returningUserEmailProvided) {
      return res.status(401).json({ message: "User was not found" });
    }

    // ensure password correct:
    const correctPassword =
      await returningUserEmailProvided.comparePassword(password);
    if (!correctPassword) {
      return res
        .status(401)
        .json({ message: "Unable to find user with these credentials" });
    }

    // create a JWT login session token for the user if email/password matched
    const loginSessionToken = jwt.sign(
      {
        id: returningUserEmailProvided._id,
        email: returningUserEmailProvided.email,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );
    res.json({ loginSessionToken });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Returning user login failed!...API/developer issue." });
  }
};

// Controller for GET /me route
// This function runs AFTER the 'protect' middleware has verified the token
// and attached the user object to the request (req.user).
export const getLoggedInUser = async (req, res) => {
  try {
    // req.user is populated by the 'protect' middleware and contains the
    // user's data from the database, excluding the password hash.
    // We send this object back to the client.
    res.status(200).json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve user data." });
  }
};

// Controller for GET /me/foundCVEs route
// This function runs AFTER the 'protect' middleware has verified the token
// and attached the user object to the request (req.user)
export const getFoundCVEs = async (req, res) => {
  // The 'protect' middleware ensures req.user is available here and contains the
  // user data (excluding passwordHash) from the database.
  try {
    // Ensure we return an empty array if the field is missing (Legacy data)
    const found = req.user.foundCVEs || [];
    // Send back only the foundCVEs array from the user object
    res.status(200).json(found);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve found CVE data." });
  }
};

// Controller for POST /me/foundCVEs route
// This function adds a new found CVE record to the user's document.
export const addFoundCVE = async (req, res) => {
  // We expect the body to contain the data needed for the sub-document:
  // { ids: ['CVE-ID-1', 'CVE-ID-2'], timestamp: '...', filename: '...' }
  const { ids, timestamp, filename } = req.body;
  const user = req.user; // req.user is populated by the 'protect' middleware

  // Basic validation
  if (!ids || !timestamp || !filename) {
    return res.status(400).json({
      message: "Missing required fields: ids (array), timestamp, and filename.",
    });
  }

  try {
    // Create the new sub-document object
    const newFoundEntry = {
      ids,
      timestamp: new Date(timestamp), // Ensure it's a valid Date object
      filename,
    };

    // Initialize array if it doesn't exist (Legacy User Data)
    if (!user.foundCVEs) {
      user.foundCVEs = [];
    }

    // Add the new entry to the foundCVEs array
    user.foundCVEs.push(newFoundEntry);

    // Save the updated user document back to the database
    await user.save();

    // Respond with the newly added entry (or the entire list)
    res.status(201).json({
      message: "Found CVEs successfully added.",
      newEntry: newFoundEntry,
      currentFoundCVEsCount: user.foundCVEs.length,
    });
  } catch (error) {
    console.error("Error adding found CVEs:", error);
    // 500 status for database or server-side issues
    res.status(500).json({
      message: "Failed to add found CVE data due to a server error.",
    });
  }
};

// Controller for GET /me/savedCVEs route
// This function retrieves the simple array of saved CVE IDs from the user's document.
export const getSavedCVEs = async (req, res) => {
  // The 'protect' middleware guarantees that req.user is the authenticated user's document
  // (without the password hash).
  try {
    // Ensure we return an empty array if the field is missing (Legacy data)
    const saved = req.user.savedCVEs || [];
    // Send back only the savedCVEs array from the user object.
    res.status(200).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve saved CVE data." });
  }
};

// Controller for POST /me/savedCVEs route
// This function adds a new CVE ID to the user's saved CVEs array.
export const addSavedCVE = async (req, res) => {
  // We expect the body to contain the CVE ID to be saved:
  // { cveId: 'CVE-2024-1234' }
  const { cveId } = req.body;
  const user = req.user; // req.user is populated by the 'protect' middleware

  // Basic validation
  if (!cveId || typeof cveId !== "string") {
    return res.status(400).json({
      message: "Missing required field: cveId (must be a string).",
    });
  }

  try {
    // Initialize array if it doesn't exist (Legacy User Data)
    // This prevents "Cannot read properties of undefined (reading 'includes')"
    if (!user.savedCVEs) {
      user.savedCVEs = [];
    }

    // Check if the CVE ID is already in the saved list to prevent duplicates
    if (user.savedCVEs.includes(cveId)) {
      return res.status(409).json({
        message: `${cveId} is already in the saved list.`,
      });
    }

    user.savedCVEs.push(cveId);
    await user.save();

    res.status(201).json({
      message: `CVE ID ${cveId} successfully added to saved list.`,
      currentSavedCVEsCount: user.savedCVEs.length,
    });
  } catch (error) {
    console.error("Error adding saved CVE:", error);
    res.status(500).json({
      message: "Failed to add saved CVE data due to a server error.",
    });
  }
};

// Controller for DELETE /me/savedCVEs route
export const removeSavedCVE = async (req, res) => {
  // body should contain the CVE ID to be removed:
  // { cveId: 'CVE-2024-1234' }
  const { cveId } = req.body;
  const user = req.user; // req.user is populated by the 'protect' middleware

  // basic validation
  if (!cveId || typeof cveId !== "string") {
    return res.status(400).json({
      message: "Missing required field: cveId (must be a string).",
    });
  }

  try {
    // ignore if CVE is already in there
    if (!user.savedCVEs.includes(cveId)) {
      return res.status(404).json({
        message: `${cveId} not found in the saved list.`,
      });
    }

    // remove the CVE otherwise
    user.savedCVEs = user.savedCVEs.filter((id) => id !== cveId);
    await user.save();

    res.status(200).json({
      message: `CVE ID ${cveId} successfully removed from saved list.`,
      currentSavedCVEsCount: user.savedCVEs.length,
    });
  } catch (error) {
    console.error("Error removing saved CVE:", error);
    res.status(500).json({
      message: "Failed to remove saved CVE data due to a server error.",
    });
  }
};
