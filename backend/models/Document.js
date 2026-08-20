const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    documentType: {
      type: String,
      enum: [
        "Medical History",
        "Lab Report",
        "Prescription",
        "Imaging / Scan",
        "Discharge Summary",
        "Other Document",
      ],
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    doctorNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);