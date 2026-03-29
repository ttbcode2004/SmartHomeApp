import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

/* ================================================================
   HELPER
================================================================ */
const handleError = (res, err, msg = "Server error") => {
  console.error(err);
  return res.status(500).json({ success: false, message: msg, error: err.message });
};

export const createOrder = async (req, res) => {
  try {
    const { products, address, paymentMethod } = req.body;
    
    if (!products || !products.length) {
      return res.status(400).json({ success: false, message: "No products provided" });
    }
    if (!address || !address.fullName || !address.phone || !address.street || !address.city) {
      return res.status(400).json({ success: false, message: "Invalid address" });
    }
    if (!["cod", "momo", "vnpay"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalPrice = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const order = await Order.create({
      user: req.userId,
      products,
      address,
      paymentMethod,
      totalQuantity,
      totalPrice,
    });

    // Xoá cart sau khi đặt hàng thành công
    await User.findByIdAndUpdate({_id:req.userId}, { $set: { cart: [] } });

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getMyOrders = async (req, res) => {
  try {

    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.userId };
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    return res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "firstName lastName email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Kiểm tra quyền: user chỉ xem được đơn của mình

    if (req.user.role !== "admin" && order.user._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return handleError(res, err);
  }
};


export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status "${order.status}"`,
      });
    }

    await order.updateStatus("cancelled");
    return res.json({ success: true, message: "Order cancelled", data: order });
  } catch (err) {
    return handleError(res, err);
  }
};


export const confirmReceived = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "delivered") {
      return res.status(400).json({ success: false, message: "Order has not been delivered yet" });
    }

    order.isReceived = true;
    await order.save();

    return res.json({ success: true, message: "Order confirmed as received", data: order });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   ADMIN – QUẢN LÝ ĐƠN HÀNG
================================================================ */

export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, isPaid, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (isPaid !== undefined) query.isPaid = isPaid === "true";
    if (search) query.orderCode = { $regex: search, $options: "i" };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "firstName lastName email profilePicture")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    return res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 * Admin cập nhật trạng thái đơn hàng
 * Body: { status }
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "shipping", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id).populate("user", "_id");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    await order.updateStatus(status);

    // Gửi notification cho user khi order thay đổi trạng thái
    await Notification.create({
      from: order.user._id, // from chính user đó (self notification về order)
      to: order.user._id,
      type: "order",
      message: `Đơn hàng #${order.orderCode} đã chuyển sang trạng thái: ${status}`,
    });

    return res.json({ success: true, data: order });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/admin/orders/:id/paid
 * Admin xác nhận thanh toán
 */
export const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.isPaid) {
      return res.status(409).json({ success: false, message: "Order already marked as paid" });
    }

    await order.markAsPaid();
    return res.json({ success: true, message: "Order marked as paid", data: order });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/admin/orders/:id
 * Admin xoá đơn hàng (chỉ xoá được đơn đã huỷ)
 */
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "cancelled") {
      return res.status(400).json({ success: false, message: "Only cancelled orders can be deleted" });
    }

    await order.deleteOne();
    return res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/admin/orders/stats
 * Admin xem thống kê đơn hàng
 */
export const getOrderStats = async (req, res) => {
  try {
    const [statusStats, revenueStats] = await Promise.all([
      // Thống kê theo status
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // Tổng doanh thu các đơn đã thanh toán + delivered
      Order.aggregate([
        { $match: { isPaid: true } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        statusBreakdown: statusStats,
        revenue: revenueStats[0] || { totalRevenue: 0, totalOrders: 0 },
      },
    });
  } catch (err) {
    return handleError(res, err);
  }
};