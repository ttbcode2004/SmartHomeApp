import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

/* ================================================================
   HELPER
================================================================ */
const handleError = (res, err, msg = "Server error") => {
  console.error(err);
  return res.status(500).json({ success: false, message: msg, error: err.message });
};

/* ================================================================
   NOTIFICATIONS
================================================================ */

/**
 * GET /api/notifications
 * Lấy danh sách notifications của user hiện tại
 * Query: ?page=1&limit=20&unreadOnly=true
 */
export const getNotifications = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select("_id");
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { to: currentUser._id };
    if (unreadOnly === "true") query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("from", "firstName lastName username profilePicture")
        .populate("product", "name image finalPrice")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ to: currentUser._id, isRead: false }),
    ]);

    return res.json({
      success: true,
      data: notifications,
      total,
      unreadCount,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/notifications/unread-count
 * Lấy số lượng notification chưa đọc (dùng cho badge)
 */
export const getUnreadCount = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select("_id");
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const count = await Notification.countDocuments({ to: currentUser._id, isRead: false });
    return res.json({ success: true, unreadCount: count });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Đánh dấu một notification là đã đọc
 */
export const markAsRead = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select("_id");
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, to: currentUser._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, data: notification });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Đánh dấu tất cả notifications là đã đọc
 */
export const markAllAsRead = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select("_id");
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const result = await Notification.updateMany(
      { to: currentUser._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/notifications/:id
 * Xoá một notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select("_id");
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      to: currentUser._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/notifications
 * Xoá tất cả notifications của user
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select("_id");
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const result = await Notification.deleteMany({ to: currentUser._id });
    return res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    return handleError(res, err);
  }
};