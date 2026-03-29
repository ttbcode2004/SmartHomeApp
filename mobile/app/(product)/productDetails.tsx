import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import useTheme from "@/hooks/useTheme";
import useProducts from "@/hooks/useProducts";
import useCurrentUser from "@/hooks/useCurrentUser";
import useProductActions from "@/hooks/useProductActions";
import Toast from "@/components/Toast";
import { getCategoryLabel } from "@/utils/getCategoryLabel";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProductDetailsScreen() {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();
  const router     = useRouter();
  const { id }     = useLocalSearchParams<{ id: string }>();

  const { fetchProductById, fetchRelated, selectedProduct, relatedProducts, toggleLike } = useProducts();
  const { dbUser } = useCurrentUser();

  const {
    cartLoadingId, handleAddToCart,
    wishlistLoadingId, handleToggleWishlist, isWishlisted,
    toast, opacity,
  } = useProductActions();

  const [imageIndex,  setImageIndex]  = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isLoading,   setIsLoading]   = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchProductById(id), fetchRelated(id)]).finally(() => setIsLoading(false));
  }, [id]);

  const product = selectedProduct;

  const isLiked      = product?.likes.some((l: any) => (l._id ?? l) === dbUser?._id) ?? false;
  const isOutOfStock = product?.stock === 0;
  const sellerName   = product
    ? `${product.user?.firstName ?? ""} ${product.user?.lastName ?? ""}`.trim() || product.user?.username
    : "";

  const cartLoading = cartLoadingId === product?._id;
  const wishlistLoading = wishlistLoadingId === product?._id;

  const handleToggleLike = useCallback(async () => {
    if (!product) return;
    setLikeLoading(true);
    await toggleLike(product._id);
    setLikeLoading(false);
  }, [product, toggleLike]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  /* ── Not found ── */
  if (!product) {
    return (
      <View className="flex-1 items-center justify-center gap-3" style={{ backgroundColor: colors.bg }}>
        <Feather name="alert-circle" size={48} color={colors.border} />
        <Text className="text-[15px]" style={{ color: colors.textMuted }}>Không tìm thấy sản phẩm</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Image gallery ── */}
        <View>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }
          >
            {product.images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, backgroundColor: colors.border }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Top gradient */}
          <LinearGradient
            colors={["#00000070", "transparent"]}
            className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
          />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 w-9 h-9 rounded-full items-center justify-center bg-black/40"
            style={{ top: insets.top + 8 }}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Image dots */}
          {product.images.length > 1 && (
            <View className="absolute bottom-3 self-center flex-row gap-1.5">
              {product.images.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === imageIndex ? 16 : 6,
                    height: 6, borderRadius: 3,
                    backgroundColor: i === imageIndex ? "#fff" : "#ffffff60",
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Content ── */}
        <View className="p-4 gap-3.5">

          {/* Stock + Category badges */}
          <View className="flex-row gap-2 items-center">
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: isOutOfStock ? colors.danger + "20" : colors.success + "20" }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: isOutOfStock ? colors.danger : colors.success }}
              >
                {isOutOfStock ? "Hết hàng" : `Còn ${product.stock} sản phẩm`}
              </Text>
            </View>

            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.primary + "15" }}>
              <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                {getCategoryLabel(product.category)}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text className="text-xl font-extrabold leading-[26px]" style={{ color: colors.text }}>
            {product.name}
          </Text>

          {/* Price + Like */}
          <View className="flex-row items-center justify-between">
            <Text className="text-[26px] font-black" style={{ color: colors.primary }}>
              {product.price.toLocaleString("vi-VN")}đ
            </Text>

            <TouchableOpacity
              onPress={handleToggleLike}
              disabled={likeLoading}
              className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full"
              style={{
                backgroundColor: isLiked ? colors.danger + "15" : colors.surface,
                borderWidth: 1,
                borderColor: isLiked ? colors.danger : colors.border,
              }}
            >
              {likeLoading
                ? <ActivityIndicator size={14} color={isLiked ? colors.danger : colors.textMuted} />
                : <Feather name="heart" size={15} color={isLiked ? colors.danger : colors.textMuted} />
              }
              <Text
                className="text-[13px] font-semibold"
                style={{ color: isLiked ? colors.danger : colors.textMuted }}
              >
                {product.likes.length}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Wishlist button (full width) */}
          <TouchableOpacity
            onPress={() => handleToggleWishlist(product)}
            disabled={wishlistLoading}
            className="flex-row items-center justify-center gap-2 py-3 rounded-2xl"
            style={{
              backgroundColor: isWishlisted(product._id) ? colors.danger + "15" : colors.surface,
              borderWidth: 1,
              borderColor: isWishlisted(product._id) ? colors.danger : colors.border,
              opacity: wishlistLoading ? 0.6 : 1,
            }}
          >
            {wishlistLoading
              ? <ActivityIndicator size={15} color={colors.danger} />
              : <Feather
                  name="heart"
                  size={15}
                  color={isWishlisted(product._id) ? colors.danger : colors.textMuted}
                />
            }
            <Text
              className="text-[13px] font-semibold"
              style={{ color: isWishlisted(product._id) ? colors.danger : colors.textMuted }}
            >
              {isWishlisted(product._id) ? "Đã yêu thích" : "Thêm vào yêu thích"}
            </Text>
          </TouchableOpacity>

          {/* Rating row */}
          <View
            className="flex-row items-center gap-2 p-3 rounded-xl"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <View className="flex-row gap-0.5">
              {[1,2,3,4,5].map((star) => (
                <Feather
                  key={star}
                  name="star"
                  size={14}
                  color={star <= Math.round(product.ratingsAverage) ? colors.warning : colors.border}
                />
              ))}
            </View>
            <Text className="text-[14px] font-bold" style={{ color: colors.text }}>
              {product.ratingsAverage.toFixed(1)}
            </Text>
            <Text className="text-[13px]" style={{ color: colors.textMuted }}>
              ({product.ratingsQuantity} đánh giá)
            </Text>
            <Text className="text-[13px] ml-auto" style={{ color: colors.textMuted }}>
              Đã bán: {product.sold}
            </Text>
          </View>

          {/* Seller row */}
          <TouchableOpacity
            onPress={() => router.push(`/(user)/${product.user._id}` as any)}
            className="flex-row items-center gap-2.5 p-3 rounded-xl"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            {product.user?.profilePicture ? (
              <Image source={{ uri: product.user.profilePicture }} className="w-10 h-10 rounded-full" />
            ) : (
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary + "20" }}
              >
                <Feather name="user" size={18} color={colors.primary} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-[13px] font-bold" style={{ color: colors.text }}>{sellerName}</Text>
              <Text className="text-[11px]" style={{ color: colors.textMuted }}>@{product.user.username}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Summary */}
          {product.summary && (
            <View className="gap-1.5">
              <Text className="text-[15px] font-bold" style={{ color: colors.text }}>Mô tả ngắn</Text>
              <Text className="text-[14px] leading-[21px]" style={{ color: colors.textMuted }}>
                {product.summary}
              </Text>
            </View>
          )}

          {/* Description */}
          {(product as any).description && (
            <View className="gap-1.5">
              <Text className="text-[15px] font-bold" style={{ color: colors.text }}>Chi tiết</Text>
              <Text className="text-[14px] leading-[21px]" style={{ color: colors.textMuted }}>
                {(product as any).description}
              </Text>
            </View>
          )}

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <View className="gap-2.5">
              <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                Sản phẩm liên quan
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                {relatedProducts.map((rp, i) => (
                  <TouchableOpacity
                    key={rp._id}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({ pathname: "/(product)/productDetails", params: { id: rp._id } } as any)
                    }
                    className="overflow-hidden rounded-xl"
                    style={{
                      width: 140,
                      marginLeft: i === 0 ? 16 : 10,
                      marginRight: i === relatedProducts.length - 1 ? 16 : 0,
                      backgroundColor: colors.surface,
                      borderWidth: 1, borderColor: colors.border,
                    }}
                  >
                    <Image
                      source={{ uri: rp.images[0] }}
                      className="w-full"
                      style={{ height: 100, backgroundColor: colors.border }}
                      resizeMode="cover"
                    />
                    <View className="p-2 gap-0.5">
                      <Text numberOfLines={2} className="text-[12px] font-semibold" style={{ color: colors.text }}>
                        {rp.name}
                      </Text>
                      <Text className="text-[12px] font-extrabold" style={{ color: colors.primary }}>
                        {rp.price.toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-3 flex-row gap-3"
        style={{
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.surface,
          borderTopWidth: 1, borderTopColor: colors.border,
        }}
      >
        {/* Message seller */}
        <TouchableOpacity
          className="flex-1 py-3.5 rounded-2xl items-center justify-center flex-row gap-1.5"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }}
          onPress={() => router.push(`/(user)/${product.user._id}` as any)}
        >
          <Feather name="message-circle" size={16} color={colors.primary} />
          <Text className="text-[14px] font-bold" style={{ color: colors.primary }}>Nhắn tin</Text>
        </TouchableOpacity>

        {/* Add to cart */}
        <TouchableOpacity
          onPress={() => handleAddToCart(product)}
          disabled={isOutOfStock || cartLoading}
          className="flex-[2] py-3.5 rounded-2xl items-center justify-center flex-row gap-2"
          style={{
            backgroundColor: isOutOfStock ? colors.border : colors.primary,
            opacity: cartLoading ? 0.7 : 1,
          }}
        >
          {cartLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Feather name="shopping-cart" size={16} color="#fff" />
          }
          <Text className="text-[14px] font-extrabold text-white">
            {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </Text>
        </TouchableOpacity>
      </View>

      <Toast toast={toast} opacity={opacity} />
    </View>
  );
}