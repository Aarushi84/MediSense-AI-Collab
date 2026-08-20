const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // Patient Info
    patientId: {
      type: String,
      default: "",
    },
    recordType: {
  type: String,
  enum: ["patient-ai", "doctor"],
  default: "patient-ai",
},

    patientName: {
      type: String,
      required: true,
    },

    age: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      default: "",
    },

    // Complaint
    area: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "",
    },

    // Vitals
    height: {
      type: String,
      default: "",
    },

    weight: {
      type: String,
      default: "",
    },

    bloodPressure: {
      type: String,
      default: "",
    },

    bloodSugar: {
      type: String,
      default: "",
    },

    // Symptoms
    symptoms: {
      type: [String],
      default: [],
    },
    otherSymptoms: {
  type: String,
  default: ""
},

    notes: {
      type: String,
      default: "",
    },

    // Image / File
    image: {
      type: String,
      default: "",
    },

    filename: {
      type: String,
      default: "",
    },

    originalname: {
      type: String,
      default: "",
    },

    reportText: {
      type: String,
      default: "",
    },

    // AI Result
    disease: {
      type: String,
      default: "",
    },

    severity: {
      type: String,
      default: "Moderate",
    },

    summary: {
      type: String,
      default: "",
    },

    confidence: {
      type: Number,
      default: 0,
    },

    treatments: {
      type: [String],
      default: [],
    },

    warnings: {
      type: [String],
      default: [],
    },

    abnormalities: {
      type: [String],
      default: [],
    },

    seeDoctorReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);