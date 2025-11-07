import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(".")); // serve frontend

const CASHFREE_BASE =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

// ✅ Create payment order
app.post("/create-order", async (req, res) => {
  try {
    const data = req.body;
    const orderId = "ORD" + Date.now();

    const response = await fetch(`${CASHFREE_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: 50,
        order_currency: "INR",
        customer_details: {
          customer_id: "CUST_" + Date.now(),
          customer_name: data.fullName,
          customer_email: data.email,
          customer_phone: data.phone,
        },
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// ✅ Send data to Discord after success
app.post("/payment-success", async (req, res) => {
  const info = req.body;

  await fetch(process.env.DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `🏆 **New Tournament Registration!**\n\n👤 **Full Name:** ${info.fullName}\n🎮 **IGN:** ${info.ign}\n🆔 **Player ID:** ${info.playerId}\n👥 **Team:** ${info.teamName}\n📧 **Email:** ${info.email}\n📱 **Phone:** ${info.phone}\n🎯 **Tournament:** ${info.tournamentName}\n⚔️ **Match Type:** ${info.matchType}\n🌍 **Region:** ${info.region}\n📢 **Platform:** ${info.platform}\n💰 **Amount:** ₹50\n✅ **Payment ID:** ${info.paymentId}`,
    }),
  });

  res.json({ success: true });
});

app.listen(process.env.PORT, () =>
  console.log(`✅ Server running on http://localhost:${process.env.PORT}`)
);
