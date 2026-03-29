import { useCallback, useState } from "react";
import { useAuth } from "@clerk/expo";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/* ================================================================
   TYPES
================================================================ */
export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
  image: string;
  name: string;
  category: string;
  isReturn: boolean;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  street: string;
  commune?: string;
  city: string;
  notes?: string;
}

export interface Order {
  _id: string;
  orderCode: string;
  products: OrderItem[];
  totalQuantity: number;
  totalPrice: number;
  address: OrderAddress;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  paymentMethod: "cod" | "momo" | "vnpay";
  isPaid: boolean;
  isReceived: boolean;
  createdAt: string;
}

/* ================================================================
   HOOK
================================================================ */
const useOrders = () => {
  const { getToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /* ----------------------------------------------------------------
     BASE FETCH
  ---------------------------------------------------------------- */
  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getToken();

      const res = await fetch(`${API_URL}/orders${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Request failed");
      }

      return json;
    },
    [getToken]
  );

  /* ----------------------------------------------------------------
     CREATE ORDER
  ---------------------------------------------------------------- */
  const createOrder = useCallback(
    async (payload: {
      products: OrderItem[];
      address: OrderAddress;
      paymentMethod: "cod" | "momo" | "vnpay";
    }) => {
      const json = await authFetch("/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // ✅ thêm vào đầu list
      setOrders((prev) => [json.data, ...prev]);

      return json.data as Order;
    },
    [authFetch]
  );

  /* ----------------------------------------------------------------
     GET MY ORDERS
  ---------------------------------------------------------------- */
  const getMyOrders = useCallback(
    async (params?: { page?: number; limit?: number; status?: string }) => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams(
          Object.entries(params || {}).reduce((acc, [k, v]) => {
            if (v !== undefined) acc[k] = String(v);
            return acc;
          }, {} as Record<string, string>)
        ).toString();

        const json = await authFetch(`/me${query ? `?${query}` : ""}`);

        setOrders(json.data);
        return json.data as Order[];
      } finally {
        setIsLoading(false);
      }
    },
    [authFetch]
  );

  /* ----------------------------------------------------------------
     GET ORDER DETAIL
  ---------------------------------------------------------------- */
  const getOrderById = useCallback(
    async (id: string) => {
      const json = await authFetch(`/${id}`);
      return json.data as Order;
    },
    [authFetch]
  );

  /* ----------------------------------------------------------------
     CANCEL ORDER
  ---------------------------------------------------------------- */
  const cancelOrder = useCallback(
    async (id: string) => {
      const json = await authFetch(`/${id}/cancel`, {
        method: "PATCH",
      });

      // ✅ update local state
      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, status: "cancelled" } : o
        )
      );

      return json.data as Order;
    },
    [authFetch]
  );

  /* ----------------------------------------------------------------
     CONFIRM RECEIVED
  ---------------------------------------------------------------- */
  const confirmReceived = useCallback(
    async (id: string) => {
      const json = await authFetch(`/${id}/received`, {
        method: "PATCH",
      });

      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, isReceived: true } : o
        )
      );

      return json.data as Order;
    },
    [authFetch]
  );

  return {
    orders,
    isLoading,

    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    confirmReceived,
  };
};

export default useOrders;