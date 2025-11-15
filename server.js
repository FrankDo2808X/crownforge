// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

const CASHFREE_SECRET = process.env.CASHFREE_SECRET;
const ENV = process.env.ENV || 'sandbox';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || `http://localhost:${PORT}`;

// We need raw body access for webhook signature verification.
app.use(bodyParser.json({
  verify: function (req, res, buf) {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(bodyParser.urlencoded({ extended: true }));

// Allow static files (serve index.html from public/)
app.use(express.static('public'));

// Create order endpoint (called by frontend)
app.post('/create-order', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'name, email, phone required' });
    }

    // Fixed amount: 50 INR (you can make this dynamic)
    const orderAmount = "50.00";
    const orderCurrency = "INR";
    const orderId = `CF_${Date.now()}`; // your own order id

    // Cashfree API base
    const base = ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

    const createOrderBody = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_note: `CrownForge Payment by ${name}`,
      customer_details: {
        customer_id: `${Date.now()}_${name}`, // you can use your user id
        customer_name: name,
        customer_email: email,
        customer_phone: phone
      },
      // When payment completes Cashfree will redirect user to return_url with order_id query param
      return_url: `${SERVER_BASE_URL}/return.html`,
      // Cashfree will POST payment status to this notify_url (webhook) — our /webhook handler
      notify_url: `${SERVER_BASE_URL}/webhook`
    };

    const headers = {
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET,
      'Content-Type': 'application/json'
    };

    const createResp = await axios.post(`${base}/orders`, createOrderBody, { headers });
    // Response will contain payment_session_id and order_id (and other details)
    const data = createResp.data;

    if (!data || !data.payment_session_id) {
      console.error('Create order response', data);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Return the details to frontend
    return res.json({
      order_id: data.order_id || orderId,
      payment_session_id: data.payment_session_id,
      message: 'Order created, use payment_session_id to open Cashfree Checkout'
    });
  } catch (err) {
    console.error('create-order error', err.response?.data || err.message || err);
    return res.status(500).json({ error: 'Server error creating order', details: err.response?.data || err.message });
  }
});

// Webhook endpoint to receive Cashfree notifications (notify_url)
app.post('/webhook', async (req, res) => {
  try {
    const rawBody = req.rawBody || '';
    const sig = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    // Basic checks
    if (!sig || !timestamp) {
      console.warn('Missing webhook headers');
      return res.status(400).send('Missing signature/timestamp');
    }

    // Verify signature: base64(HMAC_SHA256( timestamp + rawBody, CASHFREE_SECRET ))
    const signed = timestamp + rawBody;
    const expected = crypto.createHmac('sha256', CASHFREE_SECRET).update(signed).digest('base64');

    if (expected !== sig) {
      console.warn('Webhook signature mismatch', { expected, sig });
      return res.status(401).send('Invalid signature');
    }

    // Signature valid. Parse JSON payload
    const payload = JSON.parse(rawBody);

    // Example fields: payment_status, order_id, payment_id, payment_amount, customer_details
    // Check for success
    const paymentStatus = payload.payment_status || payload.event || null;
    // Cashfree uses different shapes - check for payment_status === 'SUCCESS' or event 'PAYMENT.CAPTURED' etc.
    const isSuccess = (paymentStatus === 'SUCCESS' || paymentStatus === 'PAYMENT.CAPTURED' || (payload?.transaction_details && payload?.transaction_details?.length));

    // If success, send to Discord webhook
    if (isSuccess) {
      // Prepare message
      const customer = payload?.customer_details || payload?.customer || {};
      const orderId = payload.order_id || payload.data?.order_id || payload?.order?.order_id;
      const amount = payload.payment_amount || payload.amount || payload.data?.payment_amount || payload?.order?.order_amount || '50.00';
      const paymentId = payload.payment_id || payload.txn_id || payload.transaction_id || payload.data?.payment_id || '';

      const discordContent = {
        username: "CrownForge Payments Bot",
        content: `**New Payment / Order Received**\n**Order:** ${orderId}\n**Amount:** ₹${amount}\n**Payment ID:** ${paymentId}\n**Name:** ${customer.customer_name || customer.name || 'N/A'}\n**Email:** ${customer.customer_email || customer.email || 'N/A'}\n**Phone:** ${customer.customer_phone || customer.phone || 'N/A'}`
      };

      // Send to Discord
      try {
        await axios.post(DISCORD_WEBHOOK_URL, discordContent);
        console.log('Discord webhook posted for order', orderId);
      } catch (dErr) {
        console.error('Error posting to Discord', dErr.response?.data || dErr.message);
      }
    }

    // Respond 200 to Cashfree
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook handling error', err);
    res.status(500).send('Server error');
  }
});

// Simple verify route you can call to check server
app.get('/ping', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
