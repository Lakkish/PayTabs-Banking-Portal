const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");

// --- CONFIGURATION ---
const app = express();
const PORT = 5001;
const MONGO_URI = "mongodb://localhost:27017/paytabs_poc"; // Ensure MongoDB is running locally

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- UTILITIES ---
// SHA-256 Hashing for PINs (Never store plain text!)
const hashPin = (pin) => {
  return crypto.createHash("sha256").update(pin).digest("hex");
};

// --- DATABASE MODELS ---
// 1. Card Schema
const cardSchema = new mongoose.Schema({
  cardNumber: { type: String, required: true, unique: true },
  pinHash: { type: String, required: true },
  balance: { type: Number, default: 0 },
  customerName: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});
const Card = mongoose.model("Card", cardSchema);

// 2. Transaction Schema
const transactionSchema = new mongoose.Schema({
  cardNumber: { type: String, required: true },
  type: { type: String, enum: ["withdraw", "topup"], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
  reason: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});
const Transaction = mongoose.model("Transaction", transactionSchema);

// --- SEEDING SCRIPT (Run on start) ---
const seedDatabase = async () => {
  try {
    const existingCard = await Card.findOne({ cardNumber: "4123456789012345" });
    if (!existingCard) {
      console.log("🌱 Seeding initial card...");
      const newCard = new Card({
        cardNumber: "4123456789012345",
        pinHash: hashPin("1234"), // Hashing '1234'
        balance: 1000.0,
        customerName: "John Doe",
        isAdmin: false,
      });
      await newCard.save();
      console.log("✅ Seed Data Created: Card 4123... created with PIN '1234'");
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
};

// --- API ENDPOINTS ---

// 1. PROCESS TRANSACTION (The Core Logic)
app.post("/process", async (req, res) => {
  const { cardNumber, pin, amount, type } = req.body;

  // Log attempt
  console.log(`Processing ${type} for ${cardNumber}`);

  try {
    // A. Find Card
    const card = await Card.findOne({ cardNumber });

    // Validation: Card exists?
    if (!card) {
      await Transaction.create({
        cardNumber,
        type,
        amount,
        status: "FAILED",
        reason: "Invalid Card",
      });
      return res.status(404).json({ status: "FAILED", reason: "Invalid Card" });
    }

    // B. Validate PIN
    const inputPinHash = hashPin(pin);
    if (inputPinHash !== card.pinHash) {
      await Transaction.create({
        cardNumber,
        type,
        amount,
        status: "FAILED",
        reason: "Invalid PIN",
      });
      return res.status(401).json({ status: "FAILED", reason: "Invalid PIN" });
    }

    // C. Process Logic
    if (type === "withdraw") {
      if (card.balance < amount) {
        await Transaction.create({
          cardNumber,
          type,
          amount,
          status: "FAILED",
          reason: "Insufficient Funds",
        });
        return res
          .status(400)
          .json({ status: "FAILED", reason: "Insufficient Funds" });
      }
      card.balance -= Number(amount);
    } else if (type === "topup") {
      card.balance += Number(amount);
    } else {
      return res
        .status(400)
        .json({ status: "FAILED", reason: "Invalid Transaction Type" });
    }

    // D. Commit Changes
    await card.save();
    await Transaction.create({
      cardNumber,
      type,
      amount,
      status: "SUCCESS",
      reason: "-",
    });

    return res.json({
      status: "SUCCESS",
      message: "Transaction Completed",
      newBalance: card.balance,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "FAILED", reason: "Internal Server Error" });
  }
});

// 2. ADMIN: GET ALL TRANSACTIONS
app.get("/transactions", async (req, res) => {
  try {
    const logs = await Transaction.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// 3. CUSTOMER: GET CARD DETAILS
app.get("/card/:cardNumber", async (req, res) => {
  try {
    const card = await Card.findOne({
      cardNumber: req.params.cardNumber,
    }).select("-pinHash");
    if (!card) return res.status(404).json({ error: "Card not found" });

    const history = await Transaction.find({
      cardNumber: req.params.cardNumber,
    }).sort({ timestamp: -1 });

    res.json({ card, history });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// --- SERVER START ---
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    seedDatabase();
    app.listen(PORT, () =>
      console.log(`🚀 System 2 (Core) running on port ${PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));
