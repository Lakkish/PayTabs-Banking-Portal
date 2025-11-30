const express = require("express");
const cors = require("cors");
const axios = require("axios");

// --- CONFIGURATION ---
const app = express();
const PORT = 5000;
const SYSTEM2_URL = "http://localhost:5001/process"; // URL of System 2

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---

// The Main Gateway Route
app.post("/transaction", async (req, res) => {
  const { cardNumber, pin, amount, type } = req.body;

  // 1. Basic Validation
  if (!cardNumber || !pin || !amount || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: "Amount must be positive" });
  }

  // 2. ROUTING LOGIC (The "Switch")
  // Requirement: Only process cards starting with '4' (Visa Simulation)
  if (!cardNumber.toString().startsWith("4")) {
    console.log(
      `🚫 Blocked transaction for card ${cardNumber} (Invalid Range)`
    );
    return res.status(400).json({
      status: "FAILED",
      reason:
        "Card range not supported. Only cards starting with '4' are accepted.",
    });
  }

  // 3. FORWARD TO SYSTEM 2 (Core Banking)
  try {
    console.log(
      `➡️ Forwarding ${type} request for ${cardNumber} to System 2...`
    );

    const response = await axios.post(SYSTEM2_URL, {
      cardNumber,
      pin,
      amount,
      type,
    });

    // Return System 2's response exactly as is
    return res.status(response.status).json(response.data);
  } catch (error) {
    // Handle errors from System 2
    if (error.response) {
      // System 2 responded with an error code (e.g., 401 Invalid PIN, 400 Insufficient Funds)
      return res.status(error.response.status).json(error.response.data);
    } else {
      // System 2 is down or unreachable
      console.error("System 2 connection error:", error.message);
      return res
        .status(503)
        .json({ status: "FAILED", reason: "Core Banking System Unavailable" });
    }
  }
});

// Health Check
app.get("/", (req, res) => {
  res.send("System 1 Gateway is running.");
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`System 1 (Gateway) running on port ${PORT}`);
});
