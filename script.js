import express from "express";
import fetch from "node-fetch";
const app = express();
app.use(express.json());

app.post("/create-order", async (req, res) => {
  const { name, email, age, amount } = req.body;

  const cfRes = await fetch("https://api.cashfree.com/pg/orders", {
    method: "POST",
    headers: {
      "x-client-id": "YOUR_CASHFREE_APP_ID",
      "x-client-secret": "YOUR_CASHFREE_SECRET_KEY",
      "x-api-version": "2022-09-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: email,
        customer_email: email,
        customer_phone: "9999999999"
      }
    })
  });

  const data = await cfRes.json();
  res.json({ orderToken: data.order_token });
});

app.listen(3000, () => console.log("Server running on port 3000"));
