import { View, Text, Image, TouchableOpacity, Pressable, ActivityIndicator } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import type { Product } from "@/hooks/useProducts";
import useTheme from "@/hooks/useTheme";

interface Props {
  product: Product;
  isWishlisted?: boolean;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  cartLoading?: boolean;
  wishlistLoading?: boolean;
}

export default function ProductCard({
  product,
  isWishlisted = false,
  onAddToCart,
  onToggleWishlist,
  cartLoading = false,
  wishlistLoading = false,
}: Props) {
  const router     = useRouter();
  const { colors } = useTheme();
  
  const isOutOfStock = product.stock === 0;
  const sellerName   =
    `${product.user?.firstName ?? ""} ${product.user?.lastName ?? ""}`.trim() ||
    product.user?.username || "Unknown";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="rounded-2xl overflow-hidden flex-1"
      style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
      onPress={() =>
        router.push({ pathname: "/(product)/productDetails", params: { id: product._id } } as any)
      }
    >
      {/* ── Image ── */}
      <View className="relative">
        <Image
          source={{ uri: product.images[0] }}
          className="w-full"
          style={{ aspectRatio: 1, backgroundColor: colors.border }}
          resizeMode="cover"
        />

        {/* Stock badge */}
        <View
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full"
          style={{ backgroundColor: isOutOfStock ? colors.danger + "ee" : colors.success + "ee" }}
        >
          <Text className="text-white text-[10px] font-bold">
            {isOutOfStock ? "Hết hàng" : `Còn ${product.stock}`}
          </Text>
        </View>

      </View>

      {/* ── Content ── */}
      <View className="p-2.5 gap-1.5">

        {/* Seller */}
        <View className="flex-row items-center gap-1">
          {product.user?.profilePicture ? (
            <Image source={{ uri: product.user.profilePicture }} className="w-4 h-4 rounded-full" />
          ) : (
            <View
              className="w-4 h-4 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + "30" }}
            >
              <Feather name="user" size={9} color={colors.primary} />
            </View>
          )}
          <Text numberOfLines={1} className="text-[11px] flex-1" style={{ color: colors.textMuted }}>
            {sellerName}
          </Text>
        </View>

        {/* Product name */}
        <Text
          numberOfLines={2}
          className="text-[13px] font-semibold leading-[18px]"
          style={{ color: colors.text }}
        >
          {product.name}
        </Text>

        {/* Rating */}
        <View className="flex-row items-center gap-1">
          <Feather name="star" size={11} color={colors.warning} />
          <Text className="text-[11px]" style={{ color: colors.textMuted }}>
            {product.ratingsAverage.toFixed(1)}{"  "}
            <Text style={{ color: colors.border }}>({product.ratingsQuantity})</Text>
          </Text>
        </View>

        {/* Price + Actions */}
        <View className="flex-row items-center justify-between mt-0.5">
          <Text className="text-[15px] font-extrabold" style={{ color: colors.primary }}>
            {product.price.toLocaleString("vi-VN")}đ
          </Text>

          <View className="flex-row gap-1.5">
            {/* Wishlist button */}
            <Pressable
              onPress={(e) => { e.stopPropagation(); onToggleWishlist?.(product); }}
              disabled={wishlistLoading}
              className="w-[30px] h-[30px] rounded-full items-center justify-center"
              style={{
                backgroundColor: isWishlisted ? colors.danger : colors.danger + "18",
                opacity: wishlistLoading ? 0.6 : 1,
              }}
            >
              {wishlistLoading
                ? <ActivityIndicator size={12} color={isWishlisted ? "#fff" : colors.danger} />
                : <Feather name="heart" size={14} color={isWishlisted ? "#fff" : colors.danger} />
              }
            </Pressable>

            {/* Cart button */}
            <Pressable
              onPress={(e) => { e.stopPropagation(); if (!isOutOfStock) onAddToCart?.(product); }}
              disabled={isOutOfStock || cartLoading}
              className="w-[30px] h-[30px] rounded-full items-center justify-center"
              style={{
                backgroundColor: isOutOfStock ? colors.border : colors.primary,
                opacity: cartLoading ? 0.6 : 1,
              }}
            >
              {cartLoading
                ? <ActivityIndicator size={12} color="#fff" />
                : <Feather name="shopping-cart" size={14} color="#fff" />
              }
            </Pressable>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}