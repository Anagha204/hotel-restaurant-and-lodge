import dotenv from "dotenv";
dotenv.config();
import express from "express";

import mongoose from "mongoose";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// import dashboardRoutes from "./routes/dashboard/dashboardRoutes.js";

import roomserviceRoutes from "./routes/lodge/roomserviceRoutes.js";
import housekeepingRoutes from "./routes/lodge/housekeepingRoutes.js";
import roombillRoutes from "./routes/lodge/roombillRoutes.js";
import aminityRoutes from "./routes/lodge/aminityRoutes.js";
import roomRoutes from "./routes/lodge/roomavailRoutes.js";
import dashboardRoutes from "./routes/dashboard/stats.js"
import nightAuditRoutes from "./routes/lodge/nightAuditRoutes.js";
import reportsRoutes from "./routes/lodge/reportsRoutes.js";
import idVerificationRoutes from "./routes/lodge/idVerificationRoutes.js";
import combinedBillingRoutes from "./routes/lodge/combinedBillingRoutes.js";
import roomsRoutes from "./routes/lodge/roomsRoutes.js";
import guestRoutes from "./routes/lodge/guestRoutes.js";
import checkinRoutes from "./routes/lodge/checkinRoutes.js";
import bookingRoutes from "./routes/lodge/bookingRoutes.js";
import serviceRoutes from "./routes/lodge/serviceRoutes.js";

import tables from "./routes/restaurant/tables.js";
import orders from "./routes/restaurant/orders.js";
import menuItems from "./routes/restaurant/menuItems.js";
import categories from "./routes/restaurant/categories.js";
import suppliers from "./routes/restaurant/supplierRoutes.js";
import purchaseRoutes from "./routes/restaurant/purchaseRoutes.js";
import inventoryRoutes from "./routes/restaurant/inventoryRoutes.js";
import salesRoutes from "./routes/restaurant/salesRoutes.js";
import reservationRoutes from "./routes/restaurant/reservationRoutes.js"
import customers from "./routes/restaurant/customers.js";
import deliveries from "./routes/restaurant/deliveries.js";
import restaurantReports from "./routes/restaurant/reports.js";
import notifications from "./routes/restaurant/notifications.js";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";


const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES
// app.use("/api/dashboard", dashboardRoutes);

app.use("/api/room", roomsRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/roomservice", roomserviceRoutes);
app.use("/api/housekeeping", housekeepingRoutes);
app.use("/api/roombilling", roombillRoutes);
app.use("/api/services", aminityRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/nightaudit", nightAuditRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/idverification", idVerificationRoutes);
app.use("/api/combinedbilling", combinedBillingRoutes);


app.use("/api/tables", tables);
app.use("/api/menu", menuItems);
app.use("/api/categories", categories);
app.use("/api/orders", orders);
app.use("/api/suppliers", suppliers);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reservations", reservationRoutes)
app.use("/api/customers", customers);
app.use("/api/deliveries", deliveries);
app.use("/api/restaurant-reports", restaurantReports);
app.use("/api/notifications", notifications);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/payment", paymentRoutes);

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});