import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StatusBar, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";
import useOrders from "@/hooks/useOrders";
import { useState } from "react";

export default function CartScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dbUser, isLoading, updateCartItem, removeFromCart, clearCart } = useCurrentUser();
  const {createOrder} = useOrders();

  const [ordering, setOrdering] = useState(false);

  const cart = dbUser?.cart ?? [];
  const total = cart.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0);

  const handleCreateOrder = async () => {
    if (!cart.length) return;

    // ⚠️ lấy default address (bạn đang có trong dbUser)
    const address = dbUser?.addresses?.find((a) => a.defaultAddress) ?? dbUser?.addresses?.[0] ?? null;
    if (!address) {
      alert("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    const { defaultAddress, ...cleanAddress } = address;

    try {
      setOrdering(true);

      // convert cart → order products
      const products = cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.finalPrice,
        image: item.image,
        name: item.name,
        category: item.category,
        isReturn: false,
      }));


       await createOrder({
        products,
        address: cleanAddress,
        paymentMethod: "cod", // tạm thời
      });

      // ✅ clear cart UI ngay (optional nếu backend đã clear)
      clearCart();

      alert("Đã đặt hàng thành công");

    } catch (err: any) {
      alert(err.message || "Đặt hàng thất bại");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surface }}
        >
          <Feather name="arrow-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold tracking-tight" style={{ color: colors.text }}>
          Giỏ hàng
        </Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => clearCart()}>
            <Text className="text-xs font-medium" style={{ color: colors.danger }}>
              Xoá tất cả
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : cart.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Feather name="shopping-cart" size={52} color={colors.border} />
          <Text className="text-base font-medium" style={{ color: colors.textMuted }}>
            Giỏ hàng trống
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, gap: 12 }}
          >
            {cart.map((item) => (
              <TouchableOpacity
                activeOpacity={0.85}
                key={item.product}
                className="flex-row items-center gap-3 p-3 rounded-2xl"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() =>
                  router.push({ pathname: "/(product)/productDetails", params: { id: item.product } } as any)
                }
              >
                <Image
                  source={{ uri: item.image }}
                  className="w-16 h-16 rounded-xl"
                  resizeMode="cover"
                  style={{ backgroundColor: colors.border }}
                />

                <View className="flex-1 gap-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.text }}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {item.category}
                  </Text>
                  <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                    {(item.finalPrice * item.quantity).toLocaleString("vi-VN")}đ
                  </Text>
                </View>

                {/* Quantity controls */}
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() =>
                      item.quantity > 1
                        ? updateCartItem(item.product, item.quantity - 1)
                        : removeFromCart(item.product)
                    }
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.border }}
                  >
                    <Feather
                      name={item.quantity === 1 ? "trash-2" : "minus"}
                      size={12}
                      color={item.quantity === 1 ? colors.danger : colors.text}
                    />
                  </TouchableOpacity>

                  <Text className="text-sm font-bold w-5 text-center" style={{ color: colors.text }}>
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    onPress={() => updateCartItem(item.product, item.quantity + 1)}
                    className="w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary + "20" }}
                  >
                    <Feather name="plus" size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Checkout bar */}
          <View
            className="px-4 py-4"
            style={{
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingBottom: 16,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm" style={{ color: colors.textMuted }}>
                Tổng cộng ({cart.length} sản phẩm)
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {total.toLocaleString("vi-VN")}đ
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateOrder}
              disabled={ordering}
              className="rounded-2xl py-4 items-center"
              style={{
                backgroundColor: ordering ? colors.border : colors.primary,
              }}
            >
              {ordering ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Thanh toán
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}