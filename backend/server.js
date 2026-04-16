require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in backend/.env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
let isDbConnected = false;

const testSchema = new mongoose.Schema({
  message: { type: String, default: "Hello from backend" },
  createdAt: { type: Date, default: Date.now }
});
const TestModel = mongoose.model("Test", testSchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String
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
  try {
    const { username, password } = req.body;

    const user = await User.create({ username, password });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});