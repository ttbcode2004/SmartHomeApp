import mongoose from "mongoose";

const { Schema } = mongoose;

/* ================= ORDER ITEM ================= */
const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    isReturn: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ================= ADDRESS ================= */
const addressSchema = new Schema(
  {
    fullName: String,
    phone: String,
    street: String,
    commune: String,
    city: String,
    notes: String,
  },
  { _id: false }
);

/* ================= ORDER ================= */
const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    products: {
      type: [orderItemSchema],
      required: true,
    },

    totalQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    address: {
      type: addressSchema,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipping",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "momo", "vnpay"],
      required: true,
    },

    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },

    paidAt: Date,

    deliveredAt: Date,

    isReceived: {
      type: Boolean,
      default: false,
    },

    orderCode: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* ================= INDEX ================= */
orderSchema.index({ createdAt: -1 });

/* ================= PRE SAVE ================= */
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Random unique code
    const random = Math.floor(100000 + Math.random() * 900000); // 6 số
    this.orderCode = `BACH${Date.now()}${random}`;
  }
  next();
});

/* ================= METHOD ================= */
orderSchema.methods.markAsPaid = function () {
  this.isPaid = true;
  this.paidAt = new Date();
  return this.save();
};

orderSchema.methods.updateStatus = function (status) {
  this.status = status;

  if (status === "delivered") {
    this.deliveredAt = new Date();
  }

  return this.save();
};

const Order = mongoose.model("Order", orderSchema);

export default  Order;