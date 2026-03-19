import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "follow",
        "like",
        "friend_request",
        "friend_accept",
        "product_like",
        "order",
      ],
      index: true,
    },

    // Optional: liên quan product
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    // Nội dung hiển thị
    message: {
      type: String,
      default: "",
    },

    // Đã đọc chưa
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/* ===== INDEX (QUAN TRỌNG) ===== */
notificationSchema.index({ to: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

/* ===== STATIC METHOD ===== */
notificationSchema.statics.createNotification = async function ({
  from,
  to,
  type,
  product = null,
}) {
  // tránh tự notify chính mình
  if (from.toString() === to.toString()) return;

  let message = "";

  switch (type) {
    case "follow":
      message = "đã theo dõi bạn";
      break;
    case "like":
      message = "đã thích sản phẩm của bạn";
      break;
    case "friend_request":
      message = "đã gửi lời mời kết bạn";
      break;
    case "friend_accept":
      message = "đã chấp nhận lời mời kết bạn";
      break;
    case "order":
      message = "đã đặt hàng";
      break;
    default:
      message = "có hoạt động mới";
  }

  return this.create({
    from,
    to,
    type,
    product,
    message,
  });
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;