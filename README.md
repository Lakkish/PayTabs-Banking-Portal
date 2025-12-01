🏦 PayTabs MERN Banking POC

A simplified banking system Proof of Concept (POC) demonstrating a microservices architecture using the MERN stack (MongoDB, Express, React, Node.js).

🚀 Project Overview

This system mimics a two-tier banking architecture:

System 1 (Gateway): Accepts transaction requests, performs range-based routing (only accepts Visa cards starting with '4'), and forwards valid requests.

System 2 (Core Banking): Manages the ledger, validates PINs using SHA-256 hashing, and stores data in MongoDB.

Frontend (React): A role-based dashboard for Customers and Super Admins.

🛠️ Prerequisites

Before running the project, ensure you have the following installed:

Node.js (v14 or higher)

MongoDB (Must be running locally on default port 27017)

📦 Installation & Setup

Follow these steps to get all three services running in separate terminals.

1. Database (MongoDB)

Make sure your local MongoDB instance is running.

# Command varies by OS, typically:
mongod
# OR check status
sudo systemctl status mongod


2. System 2 - Core Banking Service (Port 5001)

This service handles the database and security.

cd system2-core
npm install
npm start


Success Indicator: You should see ✅ Connected to MongoDB and ✅ Seed Data Created in the console.

3. System 1 - Gateway Service (Port 5000)

This service acts as the traffic controller.

cd system1-gateway
npm install
npm start


Success Indicator: You should see 🚀 System 1 (Gateway) running on port 5000.

4. Client UI - React Frontend (Port 5173)

The web interface for users.

cd client-ui
npm install
npm start


Action: Open the link provided (usually http://localhost:5173) in your browser.

🔑 Login Credentials

Use the following credentials to access the different roles in the frontend.

Role

Username

Password

Features

Customer

cust1

pass

View balance, View own history, Top-up, Withdraw

Super Admin

admin

admin

View ALL transaction logs across the system

Note: The "Customer" account is linked to the seeded card: 4123456789012345 with PIN 1234.

🧪 API Testing (Optional)

You can test the backend independently using curl or Postman.

1. Make a Transaction (Withdrawal)

curl -X POST http://localhost:5000/transaction \
-H "Content-Type: application/json" \
-d '{
  "cardNumber": "4123456789012345",
  "pin": "1234",
  "amount": 50,
  "type": "withdraw"
}'


2. Test Routing Logic (Should Fail)
Trying to use a card that doesn't start with '4'.

curl -X POST http://localhost:5000/transaction \
-H "Content-Type: application/json" \
-d '{
  "cardNumber": "5555456789012345",
  "pin": "1234",
  "amount": 50,
  "type": "withdraw"
}'


📂 Project Structure

paytabs-mern-poc/
├── system1-gateway/      # Node.js Express Gateway
│   ├── server.js         # Routing Logic
│   └── package.json
├── system2-core/         # Node.js Express Core Banking
│   ├── server.js         # DB Models, PIN Hash, Logic
│   └── package.json
├── client-ui/            # React + Vite Frontend
│   ├── src/App.jsx       # Main UI Logic
│   └── package.json
└── README.md
