import express from "express";
import { requireAuth } from "@clerk/express";
import {
  createOrder, getMyOrders, getOrderById, cancelOrder, confirmReceived,
  getAllOrders, updateOrderStatus, markOrderAsPaid, deleteOrder, getOrderStats,
} from "../controllers/order.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
 
const router = express.Router();

/* --- User --- */
router.post("/", protectRoute, createOrder);
router.get("/me", protectRoute, getMyOrders);
router.get("/:id", protectRoute, getOrderById);
router.patch("/:id/cancel", protectRoute, cancelOrder);
router.patch("/:id/received", protectRoute, confirmReceived);
 
/* --- Admin (thêm isAdmin middleware trước các route này nếu cần) --- */
router.get("/admin/all", getAllOrders);
router.get("/admin/stats", getOrderStats);
router.patch("/admin/:id/status", updateOrderStatus);
router.patch("/admin/:id/paid", markOrderAsPaid);
router.delete("/admin/:id", deleteOrder);
 
export default router;