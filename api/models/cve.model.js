import { Schema, model } from "mongoose";

const CVESchema = Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
    },

    date: {
      type: Number,
      required: true,
      default: 0,
    },

    version: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const CVE = model("CVE", CVESchema);

export default CVE;
