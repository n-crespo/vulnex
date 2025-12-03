import newUserLoginModel from "../models/newUserLogin.model.js";
import jwt from "jsonwebtoken";

// this secret is for signing JWT tokens and should be stored in env variables
const JWT_SECRET = process.env.JWT_SECRET;

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
    res
      .status(500)
      .json({ message: "Returning user login failed!...API/developer issue." });
  }
};
