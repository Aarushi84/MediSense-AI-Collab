const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Document = require("../models/Document");

async function requirePatient(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Not logged in" });
  const user = await User.findById(userId);
  if (!user || user.role !== "patient") {
    return res.status(403).json({ error: "Patient access only" });
  }
  req.patientUser = user;
  next();
}

router.get("/documents", requirePatient, async (req, res) => {
  try {
    const docs = await Document.find({ patient: req.patientUser._id })
      .populate("doctor", "name")
      .sort({ createdAt: -1 });

    res.json({
      documents: docs.map((d) => ({
        id: d._id,
        name: d.fileName,
        type: d.documentType,
        size: d.fileSize,
        message: d.doctorNotes || "",
        doctorName: d.doctor?.name || "Doctor",
        date: d.createdAt,
      })),
    });
  } catch (err) {
    console.log("PATIENT DOCUMENTS ERROR:", err.message);
    res.status(500).json({ error: "Failed to load documents" });
  }
});

router.get("/document/:id/download", requirePatient, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, patient: req.patientUser._id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const uploadDir = path.join(__dirname, "..", "uploads", "documents");
    const filePath = path.join(uploadDir, doc.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on disk" });

    res.download(filePath, doc.fileName);
  } catch (err) {
    console.log("PATIENT DOWNLOAD ERROR:", err.message);
    res.status(500).json({ error: "Failed to download document" });
  }
});

module.exports = router;