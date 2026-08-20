const axios = require("axios");

// ---------------- OLLAMA CALL (CLEAN + SAFE) ----------------
async function callOllama(prompt) {
  try {
    const response = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3.2:3b",
      stream: false,
      format: "json",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    let text = response.data.message?.content || "";
    console.log("RAW OLLAMA RESPONSE:", text);

    const parsed = JSON.parse(text);

    return {
      severity: parsed.severity || "Moderate",
      summary: parsed.summary || "",
      abnormalities: parsed.abnormalities || [],
      treatments: parsed.treatments || [],
      warnings: parsed.warnings || [],
      seeDoctorReason: parsed.seeDoctorReason || ""
    };

  } catch (err) {
    console.log("Ollama error:", err.message);

    return {
      severity: "Moderate",
      summary: "Could not generate summary",
      abnormalities: [],
      treatments: [],
      warnings: [],
      seeDoctorReason: "Please consult a doctor"
    };
  }
}

// ---------------- SYMPTOM ANALYZER ----------------
async function analyzeSymptom({ text }) {
  const prompt = `
You are an experienced medical doctor writing a patient report.

Patient condition: ${text}

Return ONLY valid JSON. No explanation. No markdown.

JSON format:
{
  "severity": "Low | Moderate | High",
  "summary": "3-4 sentence medical explanation",
  "abnormalities": ["string"],
  "treatments": ["string"],
  "warnings": ["string"],
  "seeDoctorReason": "2 sentence doctor advice"
}

Rules:
- MUST return valid JSON only
- All keys must exist
- All arrays must contain strings
`;

  return await callOllama(prompt);
}

// ---------------- CHAT ASSISTANT ----------------
async function chatAssistant({ report, question }) {
  const prompt = `
You are a medical assistant.

Context:
${report || "No report"}

Question:
${question}

Give simple, safe medical explanation.
`;

  try {
    const res = await axios.post("http://localhost:11434/api/chat", {
      model: "llama3.2:3b",
      stream: false,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    return res.data.message?.content || "No response";
  } catch (err) {
    return "AI unavailable";
  }
}

module.exports = { analyzeSymptom, chatAssistant };