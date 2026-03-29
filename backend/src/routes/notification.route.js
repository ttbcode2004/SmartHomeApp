import express from "express";
import {
  getNotifications, getUnreadCount, markAsRead, markAllAsRead,
  deleteNotification, deleteAllNotifications,
} from "../controllers/notification.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
 
const router = express.Router();
 
router.get("/", protectRoute, getNotifications);
router.get("/unread-count", protectRoute, getUnreadCount);
router.patch("/read-all", protectRoute, markAllAsRead);
router.patch("/:id/read", protectRoute, markAsRead);
router.delete("/", protectRoute, deleteAllNotifications);
router.delete("/:id", protectRoute, deleteNotification);
 
export default router;
 