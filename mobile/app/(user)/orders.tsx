import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useOrders from "@/hooks/useOrders";
import { useEffect, useState } from "react";
import { getCategoryLabel } from "@/utils/getCategoryLabel";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  delivered: { label: "Đã giao", color: "#10b981", icon: "check-circle" },
  shipping: { label: "Đang giao", color: "#3b82f6", icon: "truck" },
  pending: { label: "Chờ xác nhận", color: "#f59e0b", icon: "clock" },
  cancelled: { label: "Đã huỷ", color: "#ef4444", icon: "x-circle" },
};

export default function OrdersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { orders, getMyOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getMyOrders(); // gọi API
    } finally {
      setRefreshing(false);
    }
  };
  const openOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  useEffect(() => {
    getMyOrders();
  }, []);

  return (
    <>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
          <Text
            className="text-xl font-bold tracking-tight"
            style={{ color: colors.text }}
          >
            Đơn hàng của tôi
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          {orders.map((order) => {
            const s = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            return (
              <TouchableOpacity
                key={order._id}
                activeOpacity={0.8}
                onPress={() => openOrderDetail(order)}
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    #{order.orderCode.slice(-6)}
                  </Text>

                  <View
                    className="flex-row items-center px-2 py-1 rounded-full"
                    style={{ backgroundColor: s.color + "18" }}
                  >
                    <Feather name={s.icon as any} size={11} color={s.color} />
                    <Text className="text-xs ml-1" style={{ color: s.color }}>
                      {s.label}
                    </Text>
                  </View>
                </View>

                {/* Products preview */}
                <Text
                  className="text-sm font-semibold mb-1"
                  style={{ color: colors.text }}
                >
                  {order.products[0]?.name}
                  {order.products.length > 1 &&
                    ` +${order.products.length - 1} sản phẩm`}
                </Text>

                {/* Bottom */}
                <View className="flex-row justify-between items-center mt-2">
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </Text>

                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.primary }}
                  >
                    {order.totalPrice.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {orders.length === 0 && (
            <View className="items-center justify-center py-20 gap-3">
              <Feather name="shopping-bag" size={48} color={colors.border} />
              <Text
                className="text-base font-medium"
                style={{ color: colors.textMuted }}
              >
                Chưa có đơn hàng nào
              </Text>
            </View>
          )}
        </ScrollView>
      </ScrollView>
      <Modal visible={showModal} animationType="slide">
        <View
          className="flex-1"
          style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Chi tiết đơn
            </Text>

            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Feather name="x" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {/* Products */}
            {selectedOrder?.products.map((item: any, index: number) => (
              <View
                key={index}
                className="flex-row gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Image */}
                <Image
                  source={{ uri: item.image }}
                  className="w-16 h-16 rounded-lg"
                  resizeMode="cover"
                />

                {/* Info */}
                <View className="flex-1 justify-between">
                  <View>
                    <Text
                      numberOfLines={2}
                      className="text-sm font-semibold"
                      style={{ color: colors.text }}
                    >
                      {item.name}
                    </Text>

                    {/* Category */}
                    <Text
                      className="text-xs mt-1"
                      style={{ color: colors.textMuted }}
                    >
                      Loại: {getCategoryLabel(item.category)}
                    </Text>
                  </View>

                  {/* Bottom row */}
                  <View className="flex-row justify-between items-center mt-2">
                    <Text style={{ color: colors.textMuted }}>
                      x{item.quantity}
                    </Text>

                    <Text style={{ color: colors.primary, fontWeight: "600" }}>
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Address */}
            <View
              className="p-3 rounded-xl"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                className="font-semibold mb-1"
                style={{ color: colors.text }}
              >
                Địa chỉ nhận hàng
              </Text>
              <Text style={{ color: colors.textMuted }}>
                {selectedOrder?.address.fullName} -{" "}
                {selectedOrder?.address.phone}
              </Text>
              <Text style={{ color: colors.textMuted }}>
                {selectedOrder?.address.street},{" "}
                {selectedOrder?.address.commune}, {selectedOrder?.address.city}
              </Text>
            </View>

            {/* Total */}
            <View className="items-end mt-2">
              <Text
                className="text-lg font-bold"
                style={{ color: colors.primary }}
              >
                Tổng: {selectedOrder?.totalPrice.toLocaleString("vi-VN")}đ
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
