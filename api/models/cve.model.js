import { Schema, model } from "mongoose";

// NOTE: adding 'index: true' will speed up read queries like finding/filtering
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
      index: true,
    },
    description: {
      type: String,
      text: true, // creates a text index for keyword searching
    },
    baseSeverityScore: {
      type: Number,
      index: true, // allow for fast querying by severity
    },
    isVulnerable: {
      type: Boolean,
      index: true,
    },
    // TODO: split up cpeId into product/version. currently not indexed.
    cpeId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const CVE = model("CVE", CVESchema);

export default CVE;
