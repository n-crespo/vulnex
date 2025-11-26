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
const vulnerableEnum = ["true", "false", "Unknown"];

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
    // could turn these dates from ISO time stamp format into Date objects for better indexing?
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

    // Categorical Severity (NONE, LOW, MEDIUM, HIGH, CRITICAL, UNKNOWN)
    severityLevel: {
      type: String,
      required: true,
      index: true,
      enum: severityEnum, // Strict validation for known severity levels
    },

    // ("true", "false", "Unknown")
    isVulnerable: {
      type: String,
      required: true,
      index: true,
      enum: vulnerableEnum, // Strict validation for known vulnerability states
    },

    productName: {
      type: String,
      required: true,
      index: true, // Common query point
    },
    patchedInVersion: {
      type: String,
      required: false,
    },
    minAffectedVersion: {
      type: String,
      required: false,
    },
    maxAffectedVersion: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    strict: true, // don't allow fields that aren't in the schema
  },
);

const CVE = model("CVE", CVESchema);

export default CVE;
