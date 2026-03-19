import express from "express";
import { requireAuth } from "@clerk/express";
import {
  createOrder, getMyOrders, getOrderById, cancelOrder, confirmReceived,
  getAllOrders, updateOrderStatus, markOrderAsPaid, deleteOrder, getOrderStats,
} from "../controllers/order.controller.js";
 
const router = express.Router();
router.use(requireAuth());
 
/* --- User --- */
router.post("/", createOrder);
router.get("/me", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);
router.patch("/:id/received", confirmReceived);
 
/* --- Admin (thêm isAdmin middleware trước các route này nếu cần) --- */
router.get("/admin/all", getAllOrders);
router.get("/admin/stats", getOrderStats);
router.patch("/admin/:id/status", updateOrderStatus);
router.patch("/admin/:id/paid", markOrderAsPaid);
router.delete("/admin/:id", deleteOrder);
 
export default router;