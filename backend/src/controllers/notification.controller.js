import Notification from "../models/notification.model.js";

const handleError = (res, err, msg = "Server error") => {
  console.error(err);
  return res.status(500).json({ success: false, message: msg, error: err.message });
};

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { to: req.userId }; // ✅ dùng thẳng req.userId
    if (unreadOnly === "true") query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("from", "firstName lastName username profilePicture")
        .populate("product", "name image finalPrice")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ to: req.userId, isRead: false }),
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

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ to: req.userId, isRead: false });
    return res.json({ success: true, unreadCount: count });
  } catch (err) {
    return handleError(res, err);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, to: req.userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification)
      return res.status(404).json({ success: false, message: "Notification not found" });

    return res.json({ success: true, data: notification });
  } catch (err) {
    return handleError(res, err);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { to: req.userId, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      to: req.userId,
    });

    if (!notification)
      return res.status(404).json({ success: false, message: "Notification not found" });

    return res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ to: req.userId });
    return res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    return handleError(res, err);
  }
};