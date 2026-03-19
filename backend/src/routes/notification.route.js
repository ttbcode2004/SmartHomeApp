import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getNotifications, getUnreadCount, markAsRead, markAllAsRead,
  deleteNotification, deleteAllNotifications,
} from "../controllers/notification.controller.js";
 
const router = express.Router();
router.use(requireAuth());
 
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/", deleteAllNotifications);
router.delete("/:id", deleteNotification);
 
export default router;
 