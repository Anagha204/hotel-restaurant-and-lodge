import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";

const router = express.Router();

const CASHFREE_API_URL =
    process.env.CASHFREE_ENVIRONMENT === "production"
        ? "https://api.cashfree.com"
        : "https://sandbox.cashfree.com";

const CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;

console.log("✅ Cashfree (REST API) ready");

// Common headers for all requests
const getHeaders = () => ({
    "x-api-version": "2023-08-01",
    "x-client-id": CLIENT_ID,
    "x-client-secret": CLIENT_SECRET,
    "Content-Type": "application/json",
});

// ─── Route 1: Create Order ─────────────────────────────────────────────
router.post("/create-order", async (req, res) => {
    const { amount, type, customerName, customerPhone, customerEmail } = req.body;

    console.log("=== CREATE ORDER HIT ===");
    console.log("Amount:", amount, "| Type:", type);

    const orderId = `order_${type}_${Date.now()}`;

    const orderData = {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        order_meta: {
            return_url: `http://localhost:5173/payment-return?order_id={order_id}`,
        },
        customer_details: {
            customer_id: `cust_${Date.now()}`,
            customer_name: customerName || "Guest",
            customer_phone: customerPhone || "9999999999",
            customer_email: customerEmail || "guest@hotel.com",
        },
    };

    try {
        const response = await axios.post(
            `${CASHFREE_API_URL}/pg/orders`,
            orderData,
            { headers: getHeaders() }
        );

        console.log("✅ Order created:", response.data.order_id);
        res.json({
            success: true,
            orderId: response.data.order_id,
            paymentSessionId: response.data.payment_session_id,
        });
    } catch (err) {
        console.error(
            "❌ Cashfree error:",
            err.response?.data || err.message
        );
        res.status(500).json({
            success: false,
            message: err.response?.data?.message || err.message,
        });
    }
});

// ─── Route 2: Verify Payment ───────────────────────────────────────────
router.post("/verify-payment", async (req, res) => {
    const { orderId } = req.body;

    console.log("=== VERIFY PAYMENT HIT ===");
    console.log("Order ID:", orderId);

    try {
        const response = await axios.get(
            `${CASHFREE_API_URL}/pg/orders/${orderId}/payments`,
            { headers: getHeaders() }
        );

        const payments = response.data;
        console.log("Payments fetched:", payments);

        const success = Array.isArray(payments) &&
            payments.some(p => p.payment_status === "SUCCESS");

        if (success) {
            console.log("✅ Payment verified successfully");
            res.json({ success: true, message: "Payment verified" });
        } else {
            console.log("❌ Payment not successful");
            res.json({ success: false, message: "Payment not successful" });
        }
    } catch (err) {
        console.error(
            "❌ Verify error:",
            err.response?.data || err.message
        );
        res.status(500).json({
            success: false,
            message: err.response?.data?.message || err.message,
        });
    }
});

export default router;