const mongoose = require("mongoose");

const CVESchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
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

const CVE = mongoose.model("CVE", CVESchema);

module.exports = CVE;
