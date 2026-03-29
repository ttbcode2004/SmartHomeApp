import { useAuth, useUser } from "@clerk/expo";
import { useEffect, useRef, useState, useCallback } from "react";
import { CurrentUser, CartItem, WishlistItem, Address, PublicUser, UseCurrentUserReturn  } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/* ================================================================
   HOOK
================================================================ */
const useCurrentUser = (): UseCurrentUserReturn => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [dbUser, setDbUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  /* ----------------------------------------------------------------
     BASE FETCH HELPER
  ---------------------------------------------------------------- */
  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getToken();
      const isFormData = options.body instanceof FormData;
      const res = await fetch(`${API_URL}/users${path}`, {
        ...options,
        headers: {
          ...(!isFormData && { "Content-Type": "application/json" }),
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Request failed");
      return json;
    },
    [getToken],
  );

  const syncAndFetchUser = useCallback(async () => {
    if (!user || !API_URL) return;
    setIsLoading(true);
    setError(null);
    try {
      // Bước 1: sync Clerk → DB (không dùng response này để hiển thị)
      await fetch(`${API_URL}/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          profilePicture: user.imageUrl ?? "",
        }),
      });

      // Bước 2: fetch /me với auth → luôn lấy data mới nhất từ DB
      const json = await authFetch("/me");
      setDbUser(json.data);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [user, authFetch]);

  const updateMe = useCallback(
    async (
      data: FormData | Parameters<UseCurrentUserReturn["updateMe"]>[0],
    ) => {
      try {
        const body = data instanceof FormData ? data : JSON.stringify(data);
        const json = await authFetch("/me", { method: "PATCH", body });
        setDbUser(json.data);
        return json.data as CurrentUser;
      } catch {
        return null;
      }
    },
    [authFetch],
  );

  const isFriend = useCallback(
    (userId: string) =>
      dbUser?.friends?.some((f: any) => (f._id ?? f) === userId) ?? false,
    [dbUser?.friends],
  );

  const isFollowing = useCallback(
    (userId: string) =>
      dbUser?.following?.some((f: any) => (f._id ?? f) === userId) ?? false,
    [dbUser?.following],
  );

  const isFriendRequestSent = useCallback(
    (userId: string) =>
      dbUser?.friendRequestsSent?.some((f: any) => (f._id ?? f) === userId) ??
      false,
    [dbUser?.friendRequestsSent],
  );

  const deleteMe = useCallback(async () => {
    try {
      await authFetch("/me", { method: "DELETE" });
      setDbUser(null);
      return true;
    } catch {
      return false;
    }
  }, [authFetch]);

  /* ----------------------------------------------------------------
     CART
  ---------------------------------------------------------------- */
  const getCart = useCallback(async () => {
    const json = await authFetch("/me/cart");
    return json.data as CartItem[];
  }, [authFetch]);

  const addToCart = useCallback(
    async (item: Parameters<UseCurrentUserReturn["addToCart"]>[0]) => {
      const json = await authFetch("/me/cart", {
        method: "POST",
        body: JSON.stringify(item),
      });
      return json.data as CartItem[];
    },
    [authFetch],
  );

  const updateCartItem = useCallback(
    async (productId: string, quantity: number) => {
      const json = await authFetch(`/me/cart/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });

      setDbUser((prev) =>
        prev
          ? {
              ...prev,
              cart: json.data, // ✅ cập nhật lại cart
            }
          : prev
      );

      return json.data as CartItem[];
    },
    [authFetch]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      const json = await authFetch(`/me/cart/${productId}`, {
        method: "DELETE",
      });

      setDbUser((prev) =>
        prev
          ? {
              ...prev,
              cart: json.data,
            }
          : prev
      );

      return json.data as CartItem[];
    },
    [authFetch]
  );

  const clearCart = useCallback(async () => {
    const json = await authFetch("/me/cart", { method: "DELETE" });

    setDbUser((prev) =>
      prev
        ? {
            ...prev,
            cart: [],
          }
        : prev
    );

    return json.data as CartItem[];
  }, [authFetch]);

  /* ----------------------------------------------------------------
     WISHLIST
  ---------------------------------------------------------------- */
  const getWishlist = useCallback(async () => {
    const json = await authFetch("/me/wishlist");
    return json.data as WishlistItem[];
  }, [authFetch]);

  const toggleWishlist = useCallback(
    async (item: WishlistItem) => {
      const json = await authFetch("/me/wishlist", {
        method: "POST",
        body: JSON.stringify(item),
      });

      setDbUser((prev) =>
        prev
          ? {
              ...prev,
              wishlist: json.data, // ✅ cập nhật lại
            }
          : prev
      );

      return {
        action: json.action as "added" | "removed",
        data: json.data as WishlistItem[],
      };
    },
    [authFetch]
  );

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      const json = await authFetch(`/me/wishlist/${productId}`, {
        method: "DELETE",
      });

      setDbUser((prev) =>
        prev
          ? {
              ...prev,
              wishlist: json.data, // ✅ sync lại từ server
            }
          : prev
      );

      return json.data as WishlistItem[];
    },
    [authFetch]
  );

  /* ----------------------------------------------------------------
     ADDRESS
  ---------------------------------------------------------------- */
  const getAddresses = useCallback(async () => {
    const json = await authFetch("/me/addresses");
   
    return json.data as Address[];
  }, [authFetch]);

  const addAddress = useCallback(
    async (address: Parameters<UseCurrentUserReturn["addAddress"]>[0]) => {
      const json = await authFetch("/me/addresses", {
        method: "POST",
        body: JSON.stringify(address),
      });
      
      return json.data as Address[];
    },
    [authFetch],
  );

  const updateAddress = useCallback(
    async (index: number, data: Partial<Address>) => {
      const json = await authFetch(`/me/addresses/${index}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      setDbUser((prev) =>
        prev
          ? {
              ...prev,
              addresses: json.data, // ✅ update state
            }
          : prev
      );

      return json.data as Address[];
    },
    [authFetch]
  );

  const deleteAddress = useCallback(
    async (index: number) => {
      const json = await authFetch(`/me/addresses/${index}`, {
        method: "DELETE",
      });

      setDbUser((prev) =>
        prev
          ? {
              ...prev,
              addresses: json.data,
            }
          : prev
      );

      return json.data as Address[];
    },
    [authFetch]
  );

  const setDefaultAddress = useCallback(
    async (index: number) => {
      const json = await authFetch(`/me/addresses/${index}/default`, {
        method: "PATCH",
      });

      setDbUser((prev) =>
        prev
          ? {
              ...prev,
              addresses: json.data,
            }
          : prev
      );

      return json.data as Address[];
    },
    [authFetch]
  );

  /* ----------------------------------------------------------------
     SOCIAL – PUBLIC USER
  ---------------------------------------------------------------- */
  const getUserById = useCallback(
    async (id: string) => {
      try {
        const json = await authFetch(`/${id}`);
        return json.data as PublicUser;
      } catch {
        return null;
      }
    },
    [authFetch],
  );

  const getFollowers = useCallback(
    async (id: string) => {
      const json = await authFetch(`/${id}/followers`);
      return json.data as PublicUser[];
    },
    [authFetch],
  );

  const getFollowing = useCallback(
    async (id: string) => {
      const json = await authFetch(`/${id}/following`);
      return json.data as PublicUser[];
    },
    [authFetch],
  );

  const getFriends = useCallback(
    async (id: string) => {
      const json = await authFetch(`/${id}/friends`);
      return json.data as PublicUser[];
    },
    [authFetch],
  );

  /* ----------------------------------------------------------------
     SOCIAL – ACTIONS
  ---------------------------------------------------------------- */
  const toggleFollow = useCallback(
    async (id: string) => {
      const json = await authFetch(`/${id}/follow`, { method: "POST" });

      setDbUser((prev) => {
        if (!prev) return prev;

        const isFollowing = prev.following.some((f) => (f._id ?? f) === id);

        return {
          ...prev,
          following: isFollowing
            ? prev.following.filter((f) => (f._id ?? f) !== id)
            : [...prev.following, id],
        };
      });

      return json.action as "followed" | "unfollowed";
    },
    [authFetch],
  );
  const sendFriendRequest = useCallback(
    async (id: string) => {
      try {
        await authFetch(`/${id}/friend-request`, { method: "POST" });

        // ✅ UPDATE LOCAL STATE NGAY
        setDbUser((prev) =>
          prev
            ? {
                ...prev,
                friendRequestsSent: [...(prev.friendRequestsSent || []), id],
              }
            : prev,
        );

        return true;
      } catch {
        return false;
      }
    },
    [authFetch],
  );

  const acceptFriendRequest = useCallback(
    async (id: string) => {
      try {
        await authFetch(`/${id}/friend-accept`, { method: "POST" });

        setDbUser((prev) =>
          prev
            ? {
                ...prev,
                friends: [...prev.friends, id],
                friendRequestsReceived: prev.friendRequestsReceived.filter(
                  (f) => (f._id ?? f) !== id,
                ),
              }
            : prev,
        );

        return true;
      } catch {
        return false;
      }
    },
    [authFetch],
  );

  const cancelFriendRequest = useCallback(
    async (id: string) => {
      try {
        await authFetch(`/${id}/friend-cancel`, { method: "POST" });

        setDbUser((prev) =>
          prev
            ? {
                ...prev,
                friendRequestsSent: prev.friendRequestsSent.filter(
                  (f) => (f._id ?? f) !== id,
                ),
              }
            : prev,
        );

        return true;
      } catch {
        return false;
      }
    },
    [authFetch],
  );

  const rejectFriendRequest = useCallback(
    async (id: string) => {
      try {
        await authFetch(`/${id}/friend-reject`, { method: "POST" });

        setDbUser((prev) =>
          prev
            ? {
                ...prev,
                friendRequestsReceived: prev.friendRequestsReceived.filter(
                  (f) => (f._id ?? f) !== id,
                ),
              }
            : prev,
        );

        return true;
      } catch {
        return false;
      }
    },
    [authFetch],
  );

  const removeFriend = useCallback(
    async (id: string) => {
      try {
        await authFetch(`/${id}/friend`, { method: "DELETE" });

        setDbUser((prev) =>
          prev
            ? {
                ...prev,
                friends: prev.friends.filter((f) => (f._id ?? f) !== id),
              }
            : prev,
        );

        return true;
      } catch {
        return false;
      }
    },
    [authFetch],
  );

  /* ----------------------------------------------------------------
     EFFECTS
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!isLoaded || !user || hasFetched.current) return;
    hasFetched.current = true;
    syncAndFetchUser();
  }, [isLoaded, user, syncAndFetchUser]);

  useEffect(() => {
    if (isLoaded && !user) {
      hasFetched.current = false;
      setDbUser(null);
      setError(null);
    }
  }, [isLoaded, user]);

  /* ----------------------------------------------------------------
     RETURN
  ---------------------------------------------------------------- */
  return {
    dbUser,
    isLoading,
    error,
    refetch: syncAndFetchUser,
    updateMe,
    deleteMe,
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
    getUserById,
    getFollowers,
    getFollowing,
    getFriends,
    toggleFollow,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    cancelFriendRequest,
    rejectFriendRequest,
    isFriend,
    isFollowing,
    isFriendRequestSent,
  };
};

export default useCurrentUser;
