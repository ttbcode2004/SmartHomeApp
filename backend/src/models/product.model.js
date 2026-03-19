import mongoose from "mongoose";

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    /* ===== OWNER ===== */
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ===== SOCIAL ===== */
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    /* ===== BASIC INFO ===== */
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    images: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "Product must have at least 1 image",
      },
    },

    /* ===== CATEGORY ===== */
    category: {
      type: String,
      required: true,
      enum: [
        "control",
        "led",
        "electric",
        "curtain",
        "air-conditioner",
        "camera",
      ],
      index: true,
    },

    /* ===== BUSINESS ===== */
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* ===== RATING ===== */
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
      set: (val) => Math.round(val * 10) / 10, // làm tròn 1 chữ số
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

/* ===== INDEX (QUAN TRỌNG) ===== */
productSchema.index({ price: 1 });
productSchema.index({ ratingsAverage: -1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;