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

// JWT Protection middleware
export const protect = async (req, res, next) => {
  let token;

  // check if token is present in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // get token from header (split "bearer <token>" and take the token part)
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, JWT_SECRET);

      // attach the user object to the request (excluding the password hash)
      // this ensures req.user is available in the next controller (like getLoggedInUser)
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
  }

  // if no token is found in the header
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export default requireDbWriteAccess;
