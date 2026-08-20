const express = require("express");
const router = express.Router();
const ollama = require("ollama").default;

const Report = require("../models/Report");

router.post("/", async (req, res) => {
  try {
    const { message, name } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // 🔥 GET LATEST REPORT
    const report = await Report.findOne({ patientName: name || "" })
      .sort({ date: -1 });

    // ✅ STRONGER REPORT CONTEXT (IMPORTANT FIX)
    let reportContext = "No report found for this patient.";

    if (report) {
      reportContext = `
PATIENT MEDICAL REPORT (TRUST THIS DATA - DO NOT IGNORE):

Condition: ${report.result}
Confidence: ${report.confidence}
Area: ${report.area}
Description: ${report.description}
Duration: ${report.duration}
Severity: ${report.severity}
Summary: ${report.summary}
Treatments: ${(report.treatments || []).join(", ")}
Warnings: ${(report.warnings || []).join(", ")}
Doctor Advice: ${report.seeDoctorReason}

IMPORTANT:
- If question relates to this patient, ALWAYS use this report.
- NEVER say "I don't have access" because report IS provided above.
- If question is unrelated, ignore report.
`;
    }

    const systemPrompt = `
You are MediSense AI medical assistant.

You can:
1. Answer general medical questions
2. Answer patient-specific questions using report

RULES (VERY IMPORTANT):
- If report is present, you MUST use it when relevant
- NEVER say you do not have access to report
- NEVER ask user to provide report again
- If question is about patient health → USE REPORT
- If general question → ignore report

${reportContext}
`;

    const response = await ollama.chat({
      model: "llama3.2:3b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    return res.json({
      reply: response.message.content,
      reportUsed: !!report,
      reportId: report ? report._id : null,
      image: report ? report.image : null,   // ✅ IMPORTANT FIX YOU ASKED
    });

  } catch (err) {
    console.log("Chat Error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

module.exports = router;