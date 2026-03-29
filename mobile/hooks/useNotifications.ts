import { useAuth, useUser } from "@clerk/expo";
import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const PAGE_SIZE = 20;

/* ================================================================
   TYPES
================================================================ */
export interface NotificationItem {
  _id: string;
  type: "follow" | "friend_request" | "friend_accept" | "like" | "comment" | "order";
  from: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture: string;
  } | null;
  to: string;
  product?: { _id: string; name: string; image: string; finalPrice: number } | null;
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  fetchNotifications: (replace?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
}

/* ================================================================
   HOOK
================================================================ */
const useNotifications = (): UseNotificationsReturn => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const hasFetched = useRef(false);

  const hasMore = notifications.length < total;

  /* ----------------------------------------------------------------
     BASE FETCH HELPER
  ---------------------------------------------------------------- */
  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/notifications${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
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

  /* ----------------------------------------------------------------
     FETCH
  ---------------------------------------------------------------- */
  const fetchNotifications = useCallback(
    async (replace = true) => {
      if (!user) return;

      replace ? setIsLoading(true) : setIsLoadingMore(true);
      setError(null);

      try {
        const currentPage = replace ? 1 : pageRef.current;
        const json = await authFetch(
          `?page=${currentPage}&limit=${PAGE_SIZE}`,
        );
        
        setNotifications((prev) =>
          replace ? json.data : [...prev, ...json.data],
        );
        setUnreadCount(json.unreadCount);
        setTotal(json.total);
        pageRef.current = replace ? 2 : currentPage + 1;
      } catch (err: any) {
        setError(err?.message ?? "Unknown error");
      } finally {
        replace ? setIsLoading(false) : setIsLoadingMore(false);
      }
    },
    [user, authFetch],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchNotifications(false);
  }, [isLoadingMore, hasMore, fetchNotifications]);

  /* ----------------------------------------------------------------
     MARK AS READ
  ---------------------------------------------------------------- */
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await authFetch(`/${id}/read`, { method: "PATCH" });
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("[useNotifications] markAsRead error:", err);
      }
    },
    [authFetch],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await authFetch("/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[useNotifications] markAllAsRead error:", err);
    }
  }, [authFetch]);

  /* ----------------------------------------------------------------
     DELETE
  ---------------------------------------------------------------- */
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await authFetch(`/${id}`, { method: "DELETE" });
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setTotal((prev) => prev - 1);
      } catch (err) {
        console.error("[useNotifications] deleteNotification error:", err);
      }
    },
    [authFetch],
  );

  const deleteAll = useCallback(async () => {
    try {
      await authFetch("", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      pageRef.current = 1;
    } catch (err) {
      console.error("[useNotifications] deleteAll error:", err);
    }
  }, [authFetch]);

  /* ----------------------------------------------------------------
     EFFECTS
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!isLoaded || !user || hasFetched.current) return;
    hasFetched.current = true;
    fetchNotifications();
  }, [isLoaded, user, fetchNotifications]);

  useEffect(() => {
    if (isLoaded && !user) {
      hasFetched.current = false;
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      pageRef.current = 1;
      setError(null);
    }
  }, [isLoaded, user]);

  /* ----------------------------------------------------------------
     RETURN
  ---------------------------------------------------------------- */
  return {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
  };
};

export default useNotifications;