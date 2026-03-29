import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useState } from "react";

export default function AddressesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    dbUser,
    isLoading,
    deleteAddress,
    setDefaultAddress,
    getAddresses,
    updateAddress,
  } = useCurrentUser();

  const [refreshing, setRefreshing] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    commune: "",
    city: "",
    notes: "",
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getAddresses(); // gọi API
    } finally {
      setRefreshing(false);
    }
  };
  const addresses = dbUser?.addresses ?? [];

  const handleDelete = (index: number) => {
    Alert.alert("Xoá địa chỉ", "Bạn có chắc muốn xoá địa chỉ này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => deleteAddress(index),
      },
    ]);
  };

  const handleEdit = (addr: any, index: number) => {
    setEditingIndex(index);
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      commune: addr.commune,
      city: addr.city,
      notes: addr.notes,
    });
    setIsModalVisible(true);
  };

  const handleUpdate = async () => {
    if (editingIndex === null) return;

    await updateAddress(editingIndex, form);

    setIsModalVisible(false);
    setEditingIndex(null);
  };

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
            className="flex-1 text-xl font-bold tracking-tight"
            style={{ color: colors.text }}
          >
            Địa chỉ giao hàng
          </Text>
          <TouchableOpacity
            onPress={() => router.push("(user)/add-address" as any)}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + "15" }}
          >
            <Feather name="plus" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : addresses.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3">
            <Feather name="map-pin" size={52} color={colors.border} />
            <Text
              className="text-base font-medium"
              style={{ color: colors.textMuted }}
            >
              Chưa có địa chỉ nào
            </Text>
            <TouchableOpacity
              onPress={() => router.push("(user)/add-address" as any)}
              className="mt-2 px-5 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-sm font-semibold text-white">
                Thêm địa chỉ
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, gap: 12 }}
          >
            {addresses.map((addr, index) => (
              <View
                key={index}
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: addr.defaultAddress
                    ? colors.primary
                    : colors.border,
                }}
              >
                {/* Top row */}
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text
                      className="text-sm font-bold"
                      style={{ color: colors.text }}
                    >
                      {addr.fullName}
                    </Text>
                    {addr.defaultAddress && (
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.primary + "20" }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: colors.primary }}
                        >
                          Mặc định
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-2">
                    {!addr.defaultAddress && (
                      <TouchableOpacity
                        onPress={() => setDefaultAddress(index)}
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary + "15" }}
                      >
                        <Feather
                          name="check"
                          size={13}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleEdit(addr, index)}
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.primary + "15" }}
                    >
                      <Feather name="edit-2" size={13} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(index)}
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.danger + "15" }}
                    >
                      <Feather name="trash-2" size={13} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Phone */}
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Feather name="phone" size={12} color={colors.textMuted} />
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {addr.phone}
                  </Text>
                </View>

                {/* Address */}
                <View className="flex-row items-start gap-1.5">
                  <Feather
                    name="map-pin"
                    size={12}
                    color={colors.textMuted}
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    className="text-xs flex-1 leading-4"
                    style={{ color: colors.textMuted }}
                  >
                    {[addr.street, addr.commune, addr.city]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>

                {addr.notes ? (
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Feather name="info" size={12} color={colors.textMuted} />
                    <Text
                      className="text-xs"
                      style={{ color: colors.textMuted }}
                    >
                      {addr.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="p-4 rounded-t-3xl"
            style={{ backgroundColor: colors.bg }}
          >
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: colors.text }}
            >
              Chỉnh sửa địa chỉ
            </Text>

            {[
              { key: "fullName", placeholder: "Họ tên" },
              { key: "phone", placeholder: "Số điện thoại" },
              { key: "street", placeholder: "Địa chỉ" },
              { key: "commune", placeholder: "Phường/Xã" },
              { key: "city", placeholder: "Thành phố" },
              { key: "notes", placeholder: "Ghi chú" },
            ].map((field) => (
              <TextInput
                key={field.key}
                value={(form as any)[field.key]}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, [field.key]: text }))
                }
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                className="border rounded-xl px-3 py-2 mb-2"
                style={{
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            ))}

            {/* Actions */}
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.border }}
              >
                <Text style={{ color: colors.text }}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdate}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-bold">Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
