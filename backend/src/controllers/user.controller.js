import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

/* ================================================================
   HELPER
================================================================ */
const handleError = (res, err, msg = "Server error") => {
  console.error(err);
  return res.status(500).json({ success: false, message: msg, error: err.message });
};

/* ================================================================
   PROFILE
================================================================ */

/**
 * GET /api/users/me
 * Lấy thông tin user hiện tại (từ clerkId trong req.auth)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId }).select("-__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/users/:id
 * Lấy public profile của user theo MongoDB _id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("firstName lastName username profilePicture bannerImage bio followers following friends")
      .populate("followers", "firstName lastName username profilePicture")
      .populate("following", "firstName lastName username profilePicture")
      .populate("friends", "firstName lastName username profilePicture");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/users/me
 * Cập nhật profile (firstName, lastName, username, bio, profilePicture, bannerImage)
 */
export const updateMe = async (req, res) => {
  try {
    const allowedFields = ["firstName", "lastName", "username", "bio", "profilePicture", "bannerImage"];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }
    return handleError(res, err);
  }
};

/**
 * DELETE /api/users/me
 * Xoá tài khoản
 */
export const deleteMe = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   ADMIN – quản lý users (yêu cầu role = admin)
================================================================ */

/**
 * GET /api/users
 * Admin lấy danh sách users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const query = search
      ? { $or: [{ email: { $regex: search, $options: "i" } }, { username: { $regex: search, $options: "i" } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-cart -wishlist -addresses -__v")
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    return res.json({ success: true, data: users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/users/:id/role
 * Admin thay đổi role
 */
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("email role");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   CART
================================================================ */

/**
 * GET /api/users/me/cart
 */
export const getCart = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId }).select("cart");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.cart });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * POST /api/users/me/cart
 * Body: { product, image, name, category, quantity, finalPrice }
 * Nếu đã có product trong cart → cộng quantity
 */
export const addToCart = async (req, res) => {
  try {
    const { product, image, name, category, quantity = 1, finalPrice } = req.body;
    if (!product || !image || !name || !category || !finalPrice) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const existing = user.cart.find((item) => item.product.toString() === product);
    if (existing) {
      existing.quantity += Number(quantity);
    } else {
      user.cart.push({ product, image, name, category, quantity: Number(quantity), finalPrice });
    }

    await user.save();
    return res.json({ success: true, data: user.cart });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/users/me/cart/:productId
 * Body: { quantity }
 */
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be >= 1" });
    }

    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const item = user.cart.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ success: false, message: "Item not in cart" });

    item.quantity = Number(quantity);
    await user.save();
    return res.json({ success: true, data: user.cart });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/users/me/cart/:productId
 */
export const removeFromCart = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $pull: { cart: { product: req.params.productId } } },
      { new: true }
    ).select("cart");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.cart });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/users/me/cart
 * Xoá toàn bộ cart (sau khi checkout)
 */
export const clearCart = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: { cart: [] } },
      { new: true }
    ).select("cart");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, message: "Cart cleared", data: user.cart });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   WISHLIST
================================================================ */

/**
 * GET /api/users/me/wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId }).select("wishlist");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.wishlist });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * POST /api/users/me/wishlist
 * Body: { product, name, image, finalPrice }
 * Toggle: nếu đã có → xoá; chưa có → thêm
 */
export const toggleWishlist = async (req, res) => {
  try {
    const { product, name, image, finalPrice } = req.body;
    if (!product || !name || !image || !finalPrice) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const index = user.wishlist.findIndex((i) => i.product.toString() === product);
    let action;

    if (index !== -1) {
      user.wishlist.splice(index, 1);
      action = "removed";
    } else {
      user.wishlist.push({ product, name, image, finalPrice });
      action = "added";
    }

    await user.save();
    return res.json({ success: true, action, data: user.wishlist });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/users/me/wishlist/:productId
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $pull: { wishlist: { product: req.params.productId } } },
      { new: true }
    ).select("wishlist");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.wishlist });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   ADDRESS
================================================================ */

/**
 * GET /api/users/me/addresses
 */
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId }).select("addresses");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.addresses });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * POST /api/users/me/addresses
 * Body: { fullName, phone, street, commune, city, notes, defaultAddress }
 */
export const addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, commune, city, notes, defaultAddress = false } = req.body;
    if (!fullName || !phone || !street || !city) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Nếu set default → bỏ default của các address khác
    if (defaultAddress) {
      user.addresses.forEach((a) => (a.defaultAddress = false));
    }

    user.addresses.push({ fullName, phone, street, commune, city, notes, defaultAddress });
    await user.save();
    return res.status(201).json({ success: true, data: user.addresses });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/users/me/addresses/:index
 * Cập nhật address theo index trong mảng
 */
export const updateAddress = async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (idx < 0 || idx >= user.addresses.length) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const allowedFields = ["fullName", "phone", "street", "commune", "city", "notes", "defaultAddress"];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) user.addresses[idx][f] = req.body[f];
    });

    // Nếu set default → bỏ default các cái khác
    if (req.body.defaultAddress) {
      user.addresses.forEach((a, i) => {
        if (i !== idx) a.defaultAddress = false;
      });
    }

    await user.save();
    return res.json({ success: true, data: user.addresses });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/users/me/addresses/:index
 */
export const deleteAddress = async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (idx < 0 || idx >= user.addresses.length) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    user.addresses.splice(idx, 1);
    await user.save();
    return res.json({ success: true, data: user.addresses });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * PATCH /api/users/me/addresses/:index/default
 * Đặt một address làm mặc định
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (idx < 0 || idx >= user.addresses.length) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    user.addresses.forEach((a, i) => (a.defaultAddress = i === idx));
    await user.save();
    return res.json({ success: true, data: user.addresses });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   SOCIAL – FOLLOW
================================================================ */

/**
 * POST /api/users/:id/follow
 * Toggle follow/unfollow
 */
export const toggleFollow = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId });
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const targetId = req.params.id;
    if (currentUser._id.toString() === targetId) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ success: false, message: "Target user not found" });

    const isFollowing = currentUser.following.includes(targetId);

    if (isFollowing) {
      // Unfollow
      await Promise.all([
        User.findByIdAndUpdate(currentUser._id, { $pull: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $pull: { followers: currentUser._id } }),
      ]);
      return res.json({ success: true, action: "unfollowed" });
    } else {
      // Follow
      await Promise.all([
        User.findByIdAndUpdate(currentUser._id, { $addToSet: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUser._id } }),
      ]);

      await Notification.createNotification({
        from: currentUser._id,
        to: targetUser._id,
        type: "follow",
      });

      return res.json({ success: true, action: "followed" });
    }
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/users/:id/followers
 */
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("followers")
      .populate("followers", "firstName lastName username profilePicture");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.followers });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/users/:id/following
 */
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("following")
      .populate("following", "firstName lastName username profilePicture");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.following });
  } catch (err) {
    return handleError(res, err);
  }
};

/* ================================================================
   SOCIAL – FRIEND
================================================================ */

/**
 * POST /api/users/:id/friend-request
 * Gửi lời mời kết bạn (chỉ notify, không add friend luôn)
 */
export const sendFriendRequest = async (req, res) => {
  try {
    const sender = await User.findOne({ clerkId: req.auth.userId });
    if (!sender) return res.status(404).json({ success: false, message: "User not found" });

    const targetId = req.params.id;
    if (sender._id.toString() === targetId) {
      return res.status(400).json({ success: false, message: "Cannot send friend request to yourself" });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: "Target user not found" });

    const alreadyFriends = sender.friends.includes(targetId);
    if (alreadyFriends) {
      return res.status(409).json({ success: false, message: "Already friends" });
    }

    await Notification.createNotification({
      from: sender._id,
      to: target._id,
      type: "friend_request",
    });

    return res.json({ success: true, message: "Friend request sent" });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * POST /api/users/:id/friend-accept
 * Chấp nhận lời mời kết bạn từ user :id
 */
export const acceptFriendRequest = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId });
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const requesterId = req.params.id;
    const requester = await User.findById(requesterId);
    if (!requester) return res.status(404).json({ success: false, message: "Requester not found" });

    await Promise.all([
      User.findByIdAndUpdate(currentUser._id, { $addToSet: { friends: requesterId } }),
      User.findByIdAndUpdate(requesterId, { $addToSet: { friends: currentUser._id } }),
    ]);

    await Notification.createNotification({
      from: currentUser._id,
      to: requester._id,
      type: "friend_accept",
    });

    return res.json({ success: true, message: "Friend request accepted" });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * DELETE /api/users/:id/friend
 * Huỷ kết bạn
 */
export const removeFriend = async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId });
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    const friendId = req.params.id;

    await Promise.all([
      User.findByIdAndUpdate(currentUser._id, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: currentUser._id } }),
    ]);

    return res.json({ success: true, message: "Friend removed" });
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * GET /api/users/:id/friends
 */
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("friends")
      .populate("friends", "firstName lastName username profilePicture");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.friends });
  } catch (err) {
    return handleError(res, err);
  }
};