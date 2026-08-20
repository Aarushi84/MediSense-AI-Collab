const express = require("express");
const router = express.Router();
const User = require("../models/User");

async function requireDoctor(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Not logged in" });
  const user = await User.findById(userId);
  if (!user || user.role !== "doctor") {
    return res.status(403).json({ error: "Doctor access only" });
  }
  next();
}

router.post("/ai-lookup", requireDoctor, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array required" });
    }

const response = await fetch(`${process.env.AI_SERVICE_URL}/chat`,   {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();
    if (data.error) {
      console.log("FLASK CHAT ERROR:", data.error);
      return res.status(500).json({ error: "AI service error" });
    }

    res.json({ reply: data.reply });
  } catch (err) {
    console.log("AI LOOKUP ERROR:", err.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

module.exports = router;