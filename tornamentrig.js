const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // Run 'npm install node-fetch@2' inside functions folder

admin.initializeApp();

// SECURE KEYS (Server Side)
const APP_ID = "YOUR_CASHFREE_APP_ID";
const SECRET = "YOUR_CASHFREE_SECRET_KEY";

exports.createOrder = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") { res.end(); return; }

    const { name, docId, returnUrl } = req.body;
    const orderId = "ORD_" + Date.now();

    try {
        // 1. Create Order on Cashfree
        const response = await fetch("https://api.cashfree.com/pg/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify({
                "order_amount": 50.00,
                "order_currency": "INR",
                "order_id": orderId,
                "customer_details": {
                    "customer_id": docId, // Using Firebase Doc ID as Customer ID
                    "customer_name": name,
                    "customer_email": "user@example.com",
                    "customer_phone": "9999999999"
                },
                "order_meta": {
                    "return_url": returnUrl + "?order_id={order_id}"
                }
            })
        });

        const data = await response.json();

        // 2. Update Firestore with the Order ID
        if (docId) {
            await admin.firestore().collection("registrations").doc(docId).update({
                cashfreeOrderId: orderId,
                paymentStatus: "INITIATED"
            });
        }

        res.json(data);

    } catch (error) {
        res.status(500).send(error.toString());
    }
});