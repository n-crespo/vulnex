import { Schema, model } from "mongoose";

// This regex covers the official CVE format:
// 1. Starts with 'CVE' or 'VUL' (case-insensitive flag 'i')
// 2. hyphen
// 3. Followed by a 4-digit year
// 4. hyphen
// 5. at least one digit, generally 4 or more
const cveIdRegex = /^(CVE|VUL|TEST)-\d{4}-\d{4,}$/i;

// PERF adding 'index: true' will speed up read queries like finding/filtering
// CVEs but will slow down write operations since MongoDB has to make a new
// index for every change. This is an acceptable tradeoff since we will be
// finding/filtering much more often than writing to the CVE database.
const CVESchema = Schema(
  {
    // primary unique key
    cveId: {
      type: String,
      required: true,
      unique: true, // prevent duplicates
      index: true,
      match: [cveIdRegex, "cveId must be in the format CVE-YYYY-NNNN+"], // regex validator
      trim: true,
      uppercase: true,
    },
    // TODO: turn these dates from ISO time stamp format into Date objects for
    // proper indexing.
    published: {
      type: String,
      required: true,
      index: true,
    },
    lastModified: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      text: true, // creates a text index for keyword searching
    },
    baseSeverityScore: {
      type: Number,
      cast: false, // don't coerce type into a number
      required: true,
      validate: {
        validator: function (v) {
          // mongoose will coerce types AFTER this function passes. this
          // disallows true --> 1 from working
          return typeof v === "number" && !isNaN(v);
        },
        message: (props) =>
          `${props.value} is not a valid number for base severity score!`,
      },
      min: [1, "Base severity score must be at least 1."],
      max: [10, "Base severity score cannot exceed 10."],
    },
    isVulnerable: {
      type: Boolean,
      required: true,
      index: true,
    },
    // TODO: split up cpeId into product/version. currently not indexed.
    cpeId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true, // don't allow fields that aren't in the schema
  },
);

const CVE = model("CVE", CVESchema);

export default CVE;
