import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";

const handleError = (res, err, msg = "Server error") => {
  console.error(err);
  return res.status(500).json({ success: false, message: msg, error: err.message });
};

/* ================================================================
   PROFILE
================================================================ */

export const syncUser = async (req, res) => {
  const buildUpdate = (email, suffix) => ({
    $setOnInsert: {
      clerkId: req.body.clerkId,
      email,
      username: email.split("@")[0] + "_" + suffix,
      role: "user",

      // ✅ chỉ set lần đầu
      firstName: req.body.firstName ?? "",
      lastName: req.body.lastName ?? "",
      profilePicture: req.body.profilePicture ?? "",
    },

    // ❌ KHÔNG set lại nữa
    $set: {
      // chỉ update những field bạn muốn sync thật sự (nếu có)
    },
  });

  const options = {
    returnDocument: "after",
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  };

  try {
    const { clerkId, email } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        message: "clerkId and email are required",
      });
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      buildUpdate(email, Math.random().toString(36).slice(2, 7)),
      options
    ).select("-__v -cart -wishlist -addresses");

    return res.status(200).json({ success: true, data: user });

  } catch (err) {
    if (err.code === 11000) {
      try {
        const { clerkId, email } = req.body;

        const user = await User.findOneAndUpdate(
          { clerkId },
          buildUpdate(email, Date.now().toString(36)),
          options
        ).select("-__v -cart -wishlist -addresses");

        return res.status(200).json({ success: true, data: user });

      } catch (retryErr) {
        return handleError(res, retryErr);
      }
    }

    return handleError(res, err);
  }
};

export const getMe = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await User.findOne({ _id: userId }).select("-__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    return handleError(res, err);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id) // ← dùng params.id, không phải userId
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

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    ).end(buffer);
  });

export const updateMe = async (req, res) => {
  try {
    const allowedFields = ["firstName", "lastName", "username", "bio"];
    const updates = {};

    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Upload ảnh nếu có
    if (req.files?.profilePicture?.[0]) {
      updates.profilePicture = await uploadToCloudinary(
        req.files.profilePicture[0].buffer, "smartHomeApp/users/avatars"
      );
    }
    if (req.files?.bannerImage?.[0]) {
      updates.bannerImage = await uploadToCloudinary(
        req.files.bannerImage[0].buffer, "smartHomeApp/users/banners"
      );
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: "Username already taken" });
    return handleError(res, err);
  }
};

export const deleteMe = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
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

export const getCart = async (req, res) => {
  return res.json({ success: true, data: req.user.cart });
};

export const addToCart = async (req, res) => {
  try {
    const { product, image, name, category, quantity = 1, finalPrice } = req.body;
    if (!product || !image || !name || !category || !finalPrice) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = req.user;
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

export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be >= 1" });
    }

    const user = req.user;
    const item = user.cart.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ success: false, message: "Item not in cart" });

    item.quantity = Number(quantity);
    await user.save();
    return res.json({ success: true, data: user.cart });
  } catch (err) {
    return handleError(res, err);
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.userId },
      { $pull: { cart: { product: req.params.productId } } },
      { new: true }
    ).select("cart");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: user.cart });
  } catch (err) {
    return handleError(res, err);
  }
};

export const clearCart = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.userId },
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

export const getWishlist = async (req, res) => {
  return res.json({ success: true, data: req.user.wishlist });
};

export const toggleWishlist = async (req, res) => {
  try {
    const { product, name, image, finalPrice } = req.body;
    if (!product || !name || !image || !finalPrice) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = req.user;
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

export const removeFromWishlist = async (req, res) => {
  try {
    
    const user = await User.findOneAndUpdate(
      { _id: req.userId },
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

export const getAddresses = async (req, res) => {
  return res.json({ success: true, data: req.user.addresses });
};

export const addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, commune, city, notes, defaultAddress = false } = req.body;
    if (!fullName || !phone || !street || !city) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = req.user;
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

export const updateAddress = async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const user = req.user;
    if (idx < 0 || idx >= user.addresses.length) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const allowedFields = ["fullName", "phone", "street", "commune", "city", "notes", "defaultAddress"];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) user.addresses[idx][f] = req.body[f];
    });

    if (req.body.defaultAddress) {
      user.addresses.forEach((a, i) => { if (i !== idx) a.defaultAddress = false; });
    }

    await user.save();
    return res.json({ success: true, data: user.addresses });
  } catch (err) {
    return handleError(res, err);
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const user = req.user;
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

export const setDefaultAddress = async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const user = req.user;
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

export const toggleFollow = async (req, res) => {
  try {
    const currentUser = req.user;
    const targetId = req.params.id;

    if (currentUser._id.toString() === targetId) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ success: false, message: "Target user not found" });

    const isFollowing = currentUser.following.map(id => id.toString()).includes(targetId);

    if (isFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(currentUser._id, { $pull: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $pull: { followers: currentUser._id } }),
      ]);
      return res.json({ success: true, action: "unfollowed" });
    } else {
      await Promise.all([
        User.findByIdAndUpdate(currentUser._id, { $addToSet: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUser._id } }),
      ]);
      await Notification.createNotification({ from: currentUser._id, to: targetUser._id, type: "follow" });
      return res.json({ success: true, action: "followed" });
    }
  } catch (err) {
    return handleError(res, err);
  }
};

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

export const sendFriendRequest = async (req, res) => {
  try {
    const sender   = req.user;
    const targetId = req.params.id;

    if (sender._id.toString() === targetId)
      return res.status(400).json({ success: false, message: "Cannot send friend request to yourself" });

    const target = await User.findById(targetId);
    if (!target)
      return res.status(404).json({ success: false, message: "Target user not found" });

    // đã là bạn bè
    if (sender.friends.map(id => id.toString()).includes(targetId))
      return res.status(409).json({ success: false, message: "Already friends" });

    // đã gửi rồi
    if (sender.friendRequestsSent?.map(id => id.toString()).includes(targetId))
      return res.status(409).json({ success: false, message: "Request already sent" });

    // target đã gửi cho mình → auto accept luôn
    if (sender.friendRequestsReceived?.map(id => id.toString()).includes(targetId)) {
      await Promise.all([
        User.findByIdAndUpdate(sender._id, {
          $pull: { friendRequestsReceived: targetId },
          $addToSet: { friends: targetId },
        }),
        User.findByIdAndUpdate(targetId, {
          $pull: { friendRequestsSent: sender._id },
          $addToSet: { friends: sender._id },
        }),
      ]);

      return res.json({ success: true, message: "Friend request auto-accepted" });
    }

    // ✅ gửi request
    await Promise.all([
      // sender -> sent
      User.findByIdAndUpdate(sender._id, {
        $addToSet: { friendRequestsSent: targetId },
      }),

      // target -> received
      User.findByIdAndUpdate(targetId, {
        $addToSet: { friendRequestsReceived: sender._id },
      }),
    ]);

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

export const acceptFriendRequest = async (req, res) => {
  try {
    const currentUser = req.user;
    const requesterId = req.params.id;

    const requester = await User.findById(requesterId);
    if (!requester)
      return res.status(404).json({ success: false, message: "Requester not found" });

    // kiểm tra có request không
    if (!currentUser.friendRequestsReceived?.map(id => id.toString()).includes(requesterId)) {
      return res.status(400).json({ success: false, message: "No friend request found" });
    }

    await Promise.all([
      // current user
      User.findByIdAndUpdate(currentUser._id, {
        $pull: { friendRequestsReceived: requesterId },
        $addToSet: { friends: requesterId },
      }),

      // requester
      User.findByIdAndUpdate(requesterId, {
        $pull: { friendRequestsSent: currentUser._id },
        $addToSet: { friends: currentUser._id },
      }),
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

export const removeFriend = async (req, res) => {
  try {
    const currentUser = req.user;
    const friendId    = req.params.id;

    await Promise.all([
      User.findByIdAndUpdate(currentUser._id, {
        $pull: { friends: friendId, friendRequests: friendId },
      }),
      User.findByIdAndUpdate(friendId, {
        $pull: { friends: currentUser._id, friendRequests: currentUser._id },
      }),
    ]);

    return res.json({ success: true, message: "Friend removed" });
  } catch (err) {
    return handleError(res, err);
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    const currentUser = req.user;
    const targetId = req.params.id;

    if (currentUser._id.toString() === targetId)
      return res.status(400).json({ success: false, message: "Invalid action" });

    const target = await User.findById(targetId);
    if (!target)
      return res.status(404).json({ success: false, message: "User not found" });

    // kiểm tra có request đã gửi không
    if (!currentUser.friendRequestsSent?.some(id => id.toString() === targetId)) {
      return res.status(400).json({ success: false, message: "No sent request found" });
    }

    await Promise.all([
      // xoá khỏi sent của mình
      User.findByIdAndUpdate(currentUser._id, {
        $pull: { friendRequestsSent: targetId },
      }),

      // xoá khỏi received của người kia
      User.findByIdAndUpdate(targetId, {
        $pull: { friendRequestsReceived: currentUser._id },
      }),
    ]);

    return res.json({ success: true, message: "Friend request cancelled" });

  } catch (err) {
    return handleError(res, err);
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const currentUser = req.user;
    const requesterId = req.params.id;

    if (currentUser._id.toString() === requesterId)
      return res.status(400).json({ success: false, message: "Invalid action" });

    const requester = await User.findById(requesterId);
    if (!requester)
      return res.status(404).json({ success: false, message: "Requester not found" });

    // kiểm tra có request nhận không
    if (!currentUser.friendRequestsReceived?.some(id => id.toString() === requesterId)) {
      return res.status(400).json({ success: false, message: "No request found" });
    }

    await Promise.all([
      // xoá khỏi received của mình
      User.findByIdAndUpdate(currentUser._id, {
        $pull: { friendRequestsReceived: requesterId },
      }),

      // xoá khỏi sent của người kia
      User.findByIdAndUpdate(requesterId, {
        $pull: { friendRequestsSent: currentUser._id },
      }),
    ]);

    return res.json({ success: true, message: "Friend request rejected" });

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