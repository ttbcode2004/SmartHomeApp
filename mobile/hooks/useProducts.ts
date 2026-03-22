// hooks/useProducts.ts
import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/expo";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

export type Category =
  | "control"
  | "led"
  | "electric"
  | "curtain"
  | "air-conditioner"
  | "camera";

export type SortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "best_selling";

export interface Product {
  _id: string;
  name: string;
  summary: string;
  price: number;
  images: string[];
  category: Category;
  stock: number;
  sold: number;
  ratingsAverage: number;
  ratingsQuantity: number;
  likes: string[];
  isActive: boolean;
  createdAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture?: string;
  };
}

export interface ProductsFilter {
  page?: number;
  limit?: number;
  search?: string;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  inStock?: boolean;
}

interface PaginatedResponse {
  data: Product[];
  total: number;
  page: number;
  totalPages: number;
}

/* ─── Helpers ─────────────────────────────────────── */
const buildQuery = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

/* ─── Hook ────────────────────────────────────────── */
const useProducts = () => {
  const { getToken } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  /* ── authFetch ── */
  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getToken();
      return fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    },
    [getToken]
  );

  /* ── fetchProducts ── */
  const fetchProducts = useCallback(
    async (filter: ProductsFilter = {}, replace = true) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      replace ? setIsLoading(true) : setIsLoadingMore(true);
      setError(null);
        
      try {
        const query = buildQuery({ limit: 12, ...filter });
        console.log('====================================');
        console.log('ASE_URI', `${BASE_URL}/products?${query}`);
        console.log('====================================');
        const res = await fetch(`${BASE_URL}/products?${query}`, {
          signal: abortRef.current.signal,
        });
        const json: { success: boolean } & PaginatedResponse = await res.json();

        if (!json.success) throw new Error("Fetch failed");

        setProducts((prev) =>
          replace ? json.data : [...prev, ...json.data]
        );
        setPage(json.page);
        setTotalPages(json.totalPages);
        setTotal(json.total);
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        replace ? setIsLoading(false) : setIsLoadingMore(false);
      }
    },
    []
  );

  /* ── loadMore ── */
  const loadMore = useCallback(
    (filter: ProductsFilter = {}) => {
      if (page >= totalPages || isLoadingMore) return;
      fetchProducts({ ...filter, page: page + 1 }, false);
    },
    [page, totalPages, isLoadingMore, fetchProducts]
  );

  /* ── fetchProductById ── */
  const fetchProductById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/products/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error("Not found");
      setSelectedProduct(json.data);
      return json.data as Product;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ── fetchRelated ── */
  const fetchRelated = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}/related`);
      const json = await res.json();
      if (json.success) setRelatedProducts(json.data);
    } catch {}
  }, []);

  /* ── fetchMyProducts ── */
  const fetchMyProducts = useCallback(
    async (filter: Pick<ProductsFilter, "page" | "limit"> = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const query = buildQuery({ limit: 12, ...filter });
        const res = await authFetch(`/products/me/products?${query}`);
        const json = await res.json();
        if (!json.success) throw new Error("Fetch failed");
        setMyProducts(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [authFetch]
  );

  /* ── createProduct ── */
  const createProduct = useCallback(
    async (formData: FormData) => {
      setIsSubmitting(true);
      setError(null);
      console.log('form====================================');
      console.log(formData);
      console.log('====================================');
      try {
        const token = await getToken();
        const res = await fetch(`${BASE_URL}/products`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          // Không set Content-Type — fetch tự set multipart/form-data boundary
          body: formData,
        });
        const json = await res.json();
        console.log('json====================================');
        console.log(json);
        console.log('====================================');
        if (!json.success) throw new Error(json.message ?? "Create failed");
        setMyProducts((prev) => [json.data, ...prev]);
        return json.data as Product;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [getToken]
  );

  /* ── updateProduct ── */
  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      setIsSubmitting(true);
      try {
        const res = await authFetch(`/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? json.data : p))
        );
        setMyProducts((prev) =>
          prev.map((p) => (p._id === id ? json.data : p))
        );
        return json.data as Product;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [authFetch]
  );

  /* ── deleteProduct ── */
  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        const res = await authFetch(`/products/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setMyProducts((prev) => prev.filter((p) => p._id !== id));
        setProducts((prev) => prev.filter((p) => p._id !== id));
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [authFetch]
  );

  /* ── toggleLike ── */
  const toggleLike = useCallback(
    async (id: string) => {
      try {
        const res = await authFetch(`/products/${id}/like`, {
          method: "POST",
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        const update = (p: Product) =>
          p._id === id ? { ...p, likes: Array(json.likes).fill("") } : p;

        setProducts((prev) => prev.map(update));
        setSelectedProduct((prev) => (prev?._id === id ? update(prev) : prev));
        return json;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [authFetch]
  );

  /* ── searchProducts ── */
  const searchProducts = useCallback(
    (search: string, extra: ProductsFilter = {}) =>
      fetchProducts({ search, ...extra }),
    [fetchProducts]
  );

  return {
    // state
    products,
    myProducts,
    selectedProduct,
    relatedProducts,
    isLoading,
    isLoadingMore,
    isSubmitting,
    error,
    page,
    totalPages,
    total,
    // actions
    fetchProducts,
    loadMore,
    fetchProductById,
    fetchRelated,
    fetchMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleLike,
    searchProducts,
  };
};

export default useProducts;