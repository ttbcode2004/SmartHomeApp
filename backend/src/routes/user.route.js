import express from "express";
import { requireAuth } from "@clerk/express"; // hoặc middleware của bạn
import {
  getMe, getUserById, updateMe, deleteMe, getAllUsers, changeUserRole,
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
  getWishlist, toggleWishlist, removeFromWishlist,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
  toggleFollow, getFollowers, getFollowing,
  sendFriendRequest, acceptFriendRequest, removeFriend, getFriends,
  syncUser,
} from "../controllers/user.controller.js";
 
const router = express.Router();

router.post("/sync", syncUser);
 
// Auth guard cho tất cả routes
router.use(requireAuth());
 
/* --- Profile --- */
router.get("/me", getMe);
router.patch("/me", updateMe);
router.delete("/me", deleteMe);
router.get("/:id", getUserById);
 
/* --- Admin --- */
router.get("/", getAllUsers);               // Thêm isAdmin middleware nếu cần
router.patch("/:id/role", changeUserRole); // Thêm isAdmin middleware nếu cần
 
/* --- Cart --- */
router.get("/me/cart", getCart);
router.post("/me/cart", addToCart);
router.patch("/me/cart/:productId", updateCartItem);
router.delete("/me/cart/:productId", removeFromCart);
router.delete("/me/cart", clearCart);
 
/* --- Wishlist --- */
router.get("/me/wishlist", getWishlist);
router.post("/me/wishlist", toggleWishlist);
router.delete("/me/wishlist/:productId", removeFromWishlist);
 
/* --- Address --- */
router.get("/me/addresses", getAddresses);
router.post("/me/addresses", addAddress);
router.patch("/me/addresses/:index", updateAddress);
router.patch("/me/addresses/:index/default", setDefaultAddress);
router.delete("/me/addresses/:index", deleteAddress);
 
/* --- Social: Follow --- */
router.post("/:id/follow", toggleFollow);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
 
/* --- Social: Friend --- */
router.post("/:id/friend-request", sendFriendRequest);
router.post("/:id/friend-accept", acceptFriendRequest);
router.delete("/:id/friend", removeFriend);
router.get("/:id/friends", getFriends);
 
export default router;