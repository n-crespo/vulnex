import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// note: since requests are sent via HTTPS the API key is secure
const API_SECRET_KEY = process.env.API_SECRET_KEY;

export const requireDbWriteAccess = (req, res, next) => {
  // check for api key in 'x-api-key'
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    console.log("--- ACCESS DENIED, no api key provided.");
    return res.status(401).json({
      message: "Access Denied: No API Key provided in the x-api-key header.",
    });
  }

  if (apiKey !== API_SECRET_KEY) {
    console.log(`--- Wrong API Key: ${apiKey}`);
    return res.status(403).json({
      message: "Access Forbidden: Invalid API Key.",
    });
  }

  // console.log(`API Key is correct!`);
  next();
};

// for signing JWT tokens, should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
}

/**
 * Middleware to validate JWT and attach user context
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // check if authorization header exists and starts with Bearer
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // attach user to request (exclude sensitive hash)
    req.user = await User.findById(decoded.id).select("-passwordHash");

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
