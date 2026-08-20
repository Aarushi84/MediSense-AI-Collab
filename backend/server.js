require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { attachUserFromToken } = require("./middleware/auth");

const reportRoutes = require("./routes/reports");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachUserFromToken);

// (OPTIONAL DEBUG - REMOVE IN PRODUCTION)
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/triage")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

app.use("/reports", reportRoutes);
app.use("/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/doctor", require("./routes/doctor"));
app.use("/patient", require("./routes/patient"));
app.use("/doctor", require("./routes/doctorAI"));

// ================= FIX: HANDLE UNKNOWN ROUTES =================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});