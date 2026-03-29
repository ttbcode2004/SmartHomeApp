import express from "express";
import {
  getMe,
  getUserById,
  updateMe,
  deleteMe,
  getAllUsers,
  changeUserRole,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  toggleFollow,
  getFollowers,
  getFollowing,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriends,
  syncUser,
  cancelFriendRequest,
  rejectFriendRequest,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Public
router.post("/sync", syncUser);

/* --- Admin --- */
router.get("/", protectRoute, getAllUsers);
router.patch("/:id/role", protectRoute, changeUserRole);

/* --- Profile (me) --- */
router.get("/me", protectRoute, getMe);
router.patch(
  "/me",
  protectRoute,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  updateMe,
);
router.delete("/me", protectRoute, deleteMe);

/* --- Cart --- */
router.get("/me/cart", protectRoute, getCart);
router.post("/me/cart", protectRoute, addToCart);
router.patch("/me/cart/:productId", protectRoute, updateCartItem);
router.delete("/me/cart/:productId", protectRoute, removeFromCart);
router.delete("/me/cart", protectRoute, clearCart);

/* --- Wishlist --- */
router.get("/me/wishlist", protectRoute, getWishlist);
router.post("/me/wishlist", protectRoute, toggleWishlist);
router.delete("/me/wishlist/:productId", protectRoute, removeFromWishlist);

/* --- Address --- */
router.get("/me/addresses", protectRoute, getAddresses);
router.post("/me/addresses", protectRoute, addAddress);
router.patch("/me/addresses/:index/default", protectRoute, setDefaultAddress); // đặt trước /:index
router.patch("/me/addresses/:index", protectRoute, updateAddress);
router.delete("/me/addresses/:index", protectRoute, deleteAddress);

/* --- Dynamic :id — đặt CUỐI CÙNG --- */
router.get("/:id/followers", protectRoute, getFollowers);
router.get("/:id/following", protectRoute, getFollowing);
router.get("/:id/friends", protectRoute, getFriends);
router.post("/:id/follow", protectRoute, toggleFollow);
router.post("/:id/friend-request", protectRoute, sendFriendRequest);
router.post("/:id/friend-accept", protectRoute, acceptFriendRequest);
router.post("/:id/friend-cancel", protectRoute,  cancelFriendRequest);
router.post("/:id/friend-reject", protectRoute, rejectFriendRequest);
router.delete("/:id/friend", protectRoute, removeFriend);
router.get("/:id", protectRoute, getUserById); // ← luôn đặt cuối cùng

export default router;
