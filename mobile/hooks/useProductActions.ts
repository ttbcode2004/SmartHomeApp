import { useState, useCallback, useEffect } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";
import useToast from "@/hooks/useToast";
import type { Product } from "@/hooks/useProducts";

export interface UseProductActionsReturn {
  // Cart
  cartLoadingId: string | null;
  handleAddToCart: (product: Product) => Promise<void>;

  // Wishlist
  wishlistLoadingId: string | null;
  handleToggleWishlist: (product: Product) => Promise<void>;
  isWishlisted: (productId: string) => boolean;

  // Toast
  toast: ReturnType<typeof useToast>["toast"];
  opacity: ReturnType<typeof useToast>["opacity"];
}

const useProductActions = (): UseProductActionsReturn => {
  const { dbUser, addToCart, toggleWishlist } = useCurrentUser();
  const { toast, opacity, success, error }    = useToast();

  const [cartLoadingId,     setCartLoadingId]     = useState<string | null>(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState<string | null>(null);

  /* ── Local wishlist Set (optimistic) ── */
  const [localWishlist, setLocalWishlist] = useState<Set<string>>(
    () => new Set(dbUser?.wishlist.map((w) => w.product) ?? [])
  );

  useEffect(() => {
    setLocalWishlist(new Set(dbUser?.wishlist.map((w) => w.product) ?? []));
  }, [dbUser?.wishlist]);

  /* ── Wishlist lookup ── */
  const isWishlisted = useCallback(
    (productId: string) => localWishlist.has(productId),
    [localWishlist]
  );

  /* ── Add to cart ── */
  const handleAddToCart = useCallback(async (product: Product) => {
    setCartLoadingId(product._id);
    try {
      await addToCart({
        product:    product._id,
        image:      product.images[0],
        name:       product.name,
        category:   product.category,
        finalPrice: product.price,
        quantity:   1,
      });
      success("Đã thêm vào giỏ hàng 🛒", product.name);
    } catch {
      error("Thêm vào giỏ hàng thất bại", "Vui lòng thử lại");
    } finally {
      setCartLoadingId(null);
    }
  }, [addToCart, success, error]);

  /* ── Toggle wishlist ── */
  const handleToggleWishlist = useCallback(async (product: Product) => {
    setWishlistLoadingId(product._id);

    // Optimistic: cập nhật UI ngay lập tức
    setLocalWishlist((prev) => {
      const next = new Set(prev);
      next.has(product._id) ? next.delete(product._id) : next.add(product._id);
      return next;
    });

    try {
      const result = await toggleWishlist({
        product:    product._id,
        name:       product.name,
        image:      product.images[0],
        finalPrice: product.price,
      });
      success(
        result.action === "added" ? "Đã thêm vào yêu thích ❤️" : "Đã bỏ khỏi yêu thích",
        product.name,
      );
    } catch {
      // Revert nếu API lỗi
      setLocalWishlist(new Set(dbUser?.wishlist.map((w) => w.product) ?? []));
      error("Thao tác thất bại", "Vui lòng thử lại");
    } finally {
      setWishlistLoadingId(null);
    }
  }, [toggleWishlist, success, error, dbUser?.wishlist]);

  return {
    cartLoadingId,
    handleAddToCart,
    wishlistLoadingId,
    handleToggleWishlist,
    isWishlisted,
    toast,
    opacity,
  };
};

export default useProductActions;