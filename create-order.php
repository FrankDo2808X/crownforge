<?php
// ✅ Allow from all origins
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// ✅ Get input JSON
$data = json_decode(file_get_contents("php://input"), true);
$name = htmlspecialchars($data['name']);
$age = htmlspecialchars($data['age']);
$email = htmlspecialchars($data['email']);

// ✅ Cashfree Sandbox credentials (replace with your sandbox keys)
$client_id = "996661719cf9c3f3d1cb384a6d166699";
$client_secret = "cfsk_ma_prod_b40b148020d70dbe2a50b8a8f16071df_4fdb5cc6";

// ✅ Order details
$orderId = "order_" . uniqid();
$amount = 50;

// ✅ Payload for Cashfree
$payload = [
  "order_id" => $orderId,
  "order_amount" => $amount,
  "order_currency" => "INR",
  "customer_details" => [
    "customer_id" => uniqid("cust_"),
    "customer_name" => $name,
    "customer_email" => $email,
    "customer_phone" => "9999999999"
  ]
];

// ✅ Curl setup for Cashfree
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://sandbox.cashfree.com/pg/orders");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json",
  "x-client-id: $client_id",
  "x-client-secret: $client_secret"
]);
$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);

// ✅ Discord Webhook on success
if (isset($result['payment_session_id'])) {
    $discordWebhook = "YOUR_DISCORD_WEBHOOK_URL";
    $msg = [
        "content" => "**💳 New Payment Request**\nName: $name\nAge: $age\nEmail: $email\nOrder ID: $orderId\nAmount: ₹$amount"
    ];

    $ch = curl_init($discordWebhook);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($msg));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
    curl_exec($ch);
    curl_close($ch);

    echo json_encode(["order_token" => $result["payment_session_id"]]);
} else {
    echo json_encode(["message" => "Failed to create order", "response" => $result]);
}
?>
