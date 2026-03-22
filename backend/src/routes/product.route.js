// routes/productRoutes.js
import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  getProductsByUser,
  getRelatedProducts,
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
  updateStock,
  toggleLike,
  getProductLikes,
  updateRating,
  adminGetAllProducts,
  toggleProductActive,
  getProductStats,
} from "../controllers/product.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

/* ================================================================
   PUBLIC – không cần đăng nhập
================================================================ */
router.get("/", getProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/user/:userId", getProductsByUser);
router.get("/:id/related", getRelatedProducts);
router.get("/:id/likes", getProductLikes);
router.get("/:id", getProductById);

/* ================================================================
AUTH – cần đăng nhập
================================================================ */
router.post("/", upload.array("images", 10), createProduct);
router.use(requireAuth());

router.get("/me/products", getMyProducts);          // trước /:id để không bị conflict
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id/stock", updateStock);
router.post("/:id/like", toggleLike);

/* ================================================================
   ADMIN – thêm isAdmin middleware nếu cần
================================================================ */
// import { isAdmin } from "../middlewares/authMiddleware.js";

router.patch("/:id/rating", updateRating);                     // internal / admin
router.get("/admin/all", adminGetAllProducts);                 // router.get("/admin/all", isAdmin, adminGetAllProducts)
router.patch("/admin/:id/toggle-active", toggleProductActive); // router.patch("/admin/:id/toggle-active", isAdmin, toggleProductActive)
router.get("/admin/stats", getProductStats);                   // router.get("/admin/stats", isAdmin, getProductStats)
router.delete("/admin/:id/hard", hardDeleteProduct);           // router.delete("/admin/:id/hard", isAdmin, hardDeleteProduct)

export default router;

// ============================================================
// app.js – đăng ký route
// ============================================================
// import productRoutes from "./routes/productRoutes.js";
// app.use("/api/products", productRoutes);
// ============================================================