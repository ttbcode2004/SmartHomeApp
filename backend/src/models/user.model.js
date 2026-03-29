import mongoose from "mongoose";

const { Schema } = mongoose;

/* ================= CART ================= */
const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    image: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    finalPrice: {
      type: Number,
      required: true, // snapshot price
    },
  },
  { _id: false }
);

/* ================= WISHLIST ================= */
const wishlistItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    finalPrice: { type: Number, required: true },
  },
  { _id: false }
);

/* ================= ADDRESS ================= */
const addressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    commune: { type: String },
    city: { type: String, required: true },
    notes: { type: String },
    defaultAddress: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/* ================= USER ================= */
const userSchema = new Schema(
  {
    // Clerk ID (QUAN TRỌNG NHẤT)
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Info (lấy từ Clerk hoặc sync)
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    firstName: { type: String },
    lastName: { type: String },

    username: {
      type: String,
      unique: true,
      sparse: true, // cho phép null nhưng vẫn unique
    },

    profilePicture: {
      type: String,
      default: "",
    },

    bannerImage: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxLength: 160,
    },

    /* ===== BUSINESS DATA ===== */
    cart: {
      type: [cartItemSchema],
      default: [],
    },

    wishlist: {
      type: [wishlistItemSchema],
      default: [],
    },

    addresses: {
      type: [addressSchema],
      default: [],
    },

    /* ===== SOCIAL ===== */
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequestsReceived: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    friendRequestsSent: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;