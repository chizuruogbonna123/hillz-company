const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in backend/.env");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
let isDbConnected = false;

const testSchema = new mongoose.Schema({
  message: { type: String, default: "Hello from backend" },
  createdAt: { type: Date, default: Date.now }
});
const TestModel = mongoose.model("Test", testSchema);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, trim: true },
  role: { type: String, default: 'viewer' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`MongoDB connected: ${isDbConnected}`);
  });
};

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    isDbConnected = true;
    console.log("MongoDB Connected ✅");
    startServer();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    console.warn("Starting server without MongoDB connection. Data routes may fail until Mongo is available.");
    startServer();
  });

app.get("/health", (req, res) => {
  res.json({ status: "ok", mongoState: mongoose.connection.readyState });
});

app.post("/test-store", async (req, res) => {
  try {
    const doc = await TestModel.create({ message: req.body.message || "test stored" });
    res.json({ success: true, doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/register", async (req, res) => {
  console.log("/register request body:", req.body);
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: name ? String(name).trim() : undefined,
      role: role || 'viewer'
    });

    res.json({
      success: true,
      user: { email: user.email, name: user.name, role: user.role, createdAt: user.createdAt }
    });
  } catch (err) {
    console.error("/register error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/login", async (req, res) => {
  console.log("/login request body:", req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: { email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});