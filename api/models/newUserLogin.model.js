import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

// create a basic schema for new or returning users for registration/login
const newReturningUserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },

  // TODO: add GET/POST functionality for this field
  savedCVEs: {
    type: [String],
    default: [],
  }, // an array of CVE IDs

  // TODO: add GET/POST functionality for this field
  foundCVEs: {
    type: [
      {
        ids: { type: [String], required: true }, // an array of CVE IDs
        timestamp: { type: Date, required: true }, // time that the user made the upload
        filename: { type: String, required: true }, // name of the file that the user uploaded
      },
    ],
    default: [],
  },
});

// store the password in a hashed format for user security protection
newReturningUserSchema.pre("save", async function (next) {
  // if the password wasn't modified, don't hash it again
  if (!this.isModified("passwordHash")) {
    return next();
  }
  // otherwise, hash the password when received
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

// this can compare the user's entered password to the true stored hash
newReturningUserSchema.methods.comparePassword = function (tryUserPassword) {
  return bcrypt.compare(tryUserPassword, this.passwordHash);
};

// expose the model for use
export default model("NewReturningUser", newReturningUserSchema);
