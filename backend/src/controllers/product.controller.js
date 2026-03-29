import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";

/* ================================================================
   HELPER
================================================================ */
const handleError = (res, err, msg = "Server error") => {
  console.error(err);
  return res
    .status(500)
    .json({ success: false, message: msg, error: err.message });
};

/* ================================================================
   PUBLIC – AI ĐỀU CÓ THỂ XEM
================================================================ */

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, search, category,
      minPrice, maxPrice, sort = "newest", inStock,
    } = req.query;

    const filter = { isActive: true };
    if (search)   filter.name     = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (inStock === "true") filter.stock = { $gt: 0 };

    const sortMap = {
      price_asc:    { price: 1 },
      price_desc:   { price: -1 },
      rating:       { ratingsAverage: -1 },
      newest:       { createdAt: -1 },
      best_selling: { sold: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-description -__v")
        .populate("user", "firstName lastName username profilePicture")
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true, data: products, total,
      page: Number(page), limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true })
      .populate("user",  "firstName lastName username profilePicture bio")
      .populate("likes", "firstName lastName username profilePicture");

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, data: product });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const validCategories = ["control", "led", "electric", "curtain", "air-conditioner", "camera"];
    if (!validCategories.includes(req.params.category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    const { page = 1, limit = 12, sort = "newest" } = req.query;
    const sortMap = {
      price_asc: { price: 1 }, price_desc: { price: -1 },
      rating: { ratingsAverage: -1 }, newest: { createdAt: -1 }, best_selling: { sold: -1 },
    };

    const [products, total] = await Promise.all([
      Product.find({ category: req.params.category, isActive: true })
        .select("-description -__v")
        .populate("user", "firstName lastName username profilePicture")
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Product.countDocuments({ category: req.params.category, isActive: true }),
    ]);

    return res.json({
      success: true, data: products, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getProductsByUser = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const [products, total] = await Promise.all([
      Product.find({ user: req.params.userId, isActive: true })
        .select("-description -__v")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Product.countDocuments({ user: req.params.userId, isActive: true }),
    ]);

    return res.json({
      success: true, data: products, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("category");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const related = await Product.find({
      category: product.category,
      _id: { $ne: req.params.id },
      isActive: true,
    })
      .select("-description -__v")
      .populate("user", "firstName lastName username profilePicture")
      .sort({ sold: -1 })
      .limit(8);

    return res.json({ success: true, data: related });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getProductLikes = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select("likes")
      .populate("likes", "firstName lastName username profilePicture");

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, data: product.likes, total: product.likes.length });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   AUTH – USER TẠO & QUẢN LÝ SẢN PHẨM CỦA MÌNH
================================================================ */

export const createProduct = async (req, res) => {
  try {
    const { name, summary, description, price, category, stock } = req.body;
    const imagesFile = req.files;

    if (!name || !summary || !description || price === undefined || !category || !imagesFile?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Upload ảnh lên Cloudinary
    const uploadPromises = imagesFile.map((file) => {
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      return cloudinary.uploader.upload(base64Image, {
        folder: "smartHomeApp/products",
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });
    });

    const results  = await Promise.all(uploadPromises);
    const imagesUrl = results.map((r) => r.secure_url);

    const product = await Product.create({
      user:        req.userId,   // ← từ middleware
      name, summary, description, price,
      images:      imagesUrl,
      category,
      stock:       stock || 0,
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, isActive } = req.query;
    const filter = { user: req.userId };  // ← từ middleware
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true, data: products, total,
      page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    return handleError(res, err);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const isOwner = product.user.toString() === req.userId;  // ← từ middleware
    if (!isOwner && req.user.role !== "admin") {             // ← req.user.role từ middleware
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const allowedFields = ["name", "summary", "description", "price", "images", "category", "stock", "isActive"];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const isOwner = product.user.toString() === req.userId;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.json({ success: true, message: "Product deactivated" });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/products/:id/hard
 * Hard delete – chỉ admin
 */
export const hardDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    return res.json({ success: true, message: "Product permanently deleted" });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   STOCK MANAGEMENT
================================================================ */

/**
 * PATCH /api/products/:id/stock
 * Cập nhật stock (owner hoặc admin)
 * Body: { stock } hoặc { increment } để cộng/trừ
 */
export const updateStock = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select(
      "_id role",
    );
    if (!currentUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const isOwner = product.user.toString() === currentUser._id.toString();
    if (!isOwner && currentUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { stock, increment } = req.body;

    if (increment !== undefined) {
      // Cộng/trừ relative (ví dụ: increment: -5 để trừ 5)
      const newStock = product.stock + Number(increment);
      if (newStock < 0) {
        return res
          .status(400)
          .json({ success: false, message: "Stock cannot be negative" });
      }
      product.stock = newStock;
    } else if (stock !== undefined) {
      if (Number(stock) < 0) {
        return res
          .status(400)
          .json({ success: false, message: "Stock cannot be negative" });
      }
      product.stock = Number(stock);
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Provide stock or increment" });
    }

    await product.save();
    return res.json({ success: true, data: { stock: product.stock } });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   LIKES / SOCIAL
================================================================ */

/**
 * POST /api/products/:id/like
 * Toggle like/unlike sản phẩm
 */
export const toggleLike = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select(
      "_id",
    );
    if (!currentUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const product = await Product.findById(req.params.id).select("likes user");
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const userId = currentUser._id;
    const isLiked = product.likes.some(
      (id) => id.toString() === userId.toString(),
    );

    if (isLiked) {
      // Unlike
      await Product.findByIdAndUpdate(req.params.id, {
        $pull: { likes: userId },
      });
      return res.json({
        success: true,
        action: "unliked",
        likes: product.likes.length - 1,
      });
    } else {
      // Like
      await Product.findByIdAndUpdate(req.params.id, {
        $addToSet: { likes: userId },
      });

      // Gửi notification cho owner (trừ khi tự like sản phẩm của mình)
      if (product.user.toString() !== userId.toString()) {
        await Notification.createNotification({
          from: userId,
          to: product.user,
          type: "product_like",
          product: product._id,
        });
      }

      return res.json({
        success: true,
        action: "liked",
        likes: product.likes.length + 1,
      });
    }
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/products/:id/likes
 * Lấy danh sách users đã like sản phẩm
 */


/* ================================================================
   RATING
================================================================ */

/**
 * PATCH /api/products/:id/rating
 * Cập nhật rating trung bình (thường gọi từ review service sau khi có review mới)
 * Body: { ratingsAverage, ratingsQuantity }
 * Chỉ dành cho internal hoặc admin
 */
export const updateRating = async (req, res) => {
  try {
    const { ratingsAverage, ratingsQuantity } = req.body;

    if (ratingsAverage === undefined || ratingsQuantity === undefined) {
      return res
        .status(400)
        .json({
          success: false,
          message: "ratingsAverage and ratingsQuantity are required",
        });
    }
    if (ratingsAverage < 1 || ratingsAverage > 5) {
      return res
        .status(400)
        .json({
          success: false,
          message: "ratingsAverage must be between 1 and 5",
        });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { ratingsAverage, ratingsQuantity } },
      { new: true, runValidators: true },
    ).select("ratingsAverage ratingsQuantity");

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    return res.json({ success: true, data: product });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   ADMIN
================================================================ */

/**
 * GET /api/admin/products
 * Admin lấy tất cả sản phẩm (bao gồm inactive)
 * Query: ?page=1&limit=20&isActive=true&category=led&search=
 */
export const adminGetAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, category, search } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("user", "firstName lastName email username")
        .sort({ createdAt: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/admin/products/:id/toggle-active
 * Admin bật/tắt isActive
 */
export const toggleProductActive = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select(
      "isActive name",
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    product.isActive = !product.isActive;
    await product.save();

    return res.json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"}`,
      data: { isActive: product.isActive },
    });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/admin/products/stats
 * Admin xem thống kê sản phẩm
 */
export const getProductStats = async (req, res) => {
  try {
    const [categoryStats, topSelling, lowStock, totalStats] = await Promise.all(
      [
        // Thống kê theo category
        Product.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              totalSold: { $sum: "$sold" },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Top 5 bán chạy nhất
        Product.find({ isActive: true })
          .select("name category sold stock ratingsAverage images")
          .sort({ sold: -1 })
          .limit(5),

        // Sản phẩm sắp hết hàng (stock <= 5)
        Product.find({ isActive: true, stock: { $lte: 5 } })
          .select("name category stock images")
          .sort({ stock: 1 })
          .limit(10),

        // Tổng quan
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              activeProducts: { $sum: { $cond: ["$isActive", 1, 0] } },
              totalSold: { $sum: "$sold" },
              avgRating: { $avg: "$ratingsAverage" },
            },
          },
        ]),
      ],
    );

    return res.json({
      success: true,
      data: {
        overview: totalStats[0] || {},
        categoryBreakdown: categoryStats,
        topSelling,
        lowStock,
      },
    });
  } catch (err) {
    return handleError(res, err);
  }
};
