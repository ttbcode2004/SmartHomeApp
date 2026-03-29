import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  getProducts, getProductById, getProductsByCategory,
  getProductsByUser, getRelatedProducts, createProduct,
  getMyProducts, updateProduct, deleteProduct, hardDeleteProduct,
  updateStock, toggleLike, getProductLikes, updateRating,
  adminGetAllProducts, toggleProductActive, getProductStats,
} from "../controllers/product.controller.js";

const router = express.Router();

/* ── Public ── */
router.get("/",                    getProducts);
router.get("/category/:category",  getProductsByCategory);
router.get("/user/:userId",        getProductsByUser);
router.get("/:id/related",         getRelatedProducts);
router.get("/:id/likes",           getProductLikes);
router.get("/:id",                 getProductById);

/* ── Protected ── */
router.get("/me/products",         protectRoute, getMyProducts);
router.post("/",                   protectRoute, upload.array("images", 10), createProduct);
router.patch("/:id",               protectRoute, updateProduct);
router.delete("/:id",              protectRoute, deleteProduct);
router.patch("/:id/stock",         protectRoute, updateStock);
router.post("/:id/like",           protectRoute, toggleLike);
router.patch("/:id/rating",        protectRoute, updateRating);

/* ── Admin ── */
router.get("/admin/all",               protectRoute, adminGetAllProducts);
router.get("/admin/stats",             protectRoute, getProductStats);
router.patch("/admin/:id/toggle-active", protectRoute, toggleProductActive);
router.delete("/admin/:id/hard",       protectRoute, hardDeleteProduct);

export default router;