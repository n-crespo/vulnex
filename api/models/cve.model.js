import { Schema, model } from "mongoose";

// This regex covers the official CVE format:
// 1. Starts with 'CVE' or 'VUL' (case-insensitive flag 'i')
// 2. hyphen
// 3. Followed by a 4-digit year
// 4. hyphen
// 5. at least one digit, generally 4 or more
const cveIdRegex = /^(CVE|VUL|TEST)-\d{4}-\d{4,}$/i;

// Enums for strict validation
const severityEnum = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"];

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
      match: [cveIdRegex, "cveId must be in the format CVE-YYYY-NNNN+"], // regex validator
      trim: true,
      uppercase: true,
      // index: true, // implied by unique: true
    },
    // could turn these dates from ISO time stamp format into Date objects for better indexing?
    published: {
      type: Date, // instead of string
      required: true,
    },
    description: {
      type: String,
      required: true,
      // text: true, // creates a text index but VASTLY increases data size
    },

    // Categorical Severity (NONE, LOW, MEDIUM, HIGH, CRITICAL, UNKNOWN)
    severityLevel: {
      type: String,
      required: true,
      // index: true,
      enum: severityEnum, // Strict validation for known severity levels
    },

    productName: {
      type: String,
      required: true,
      index: true, // Common query point
    },

    /**
     * Standardized array of version ranges derived from NVD configurations.
     * Example: [
     * { start: "0", end: "12.22.9", s_type: "i", e_type: "e" },
     * { start: "14.0.0", end: "14.18.3", s_type: "i", e_type: "e" }
     * ]
     * s_type: i = including start
     * s_type: e = excluding end
     * e_type = end type
     */
    productVersions: {
      type: [
        {
          start: { type: String, required: true },
          end: { type: String, required: true },
          s_type: { type: String, required: true, enum: ["i", "e"] }, // inclusive/exclusive
          e_type: { type: String, required: true, enum: ["i", "e"] }, // inclusive/exclusive
          // Note: No index needed here, querying is done in app logic
          _id: false, // don't create an unnecessary id for subdocuments
        },
      ],
      // This field should only exist if the array has content (non-null check in extraction handles this)
      required: true,
    },
  },
  {
    strict: true, // don't allow fields that aren't in the schema
  },
);

const CVE = model("CVE", CVESchema);

export default CVE;
