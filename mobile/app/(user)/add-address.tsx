import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Switch,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";

import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";

export default function AddAddressScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addAddress } = useCurrentUser();

  const [form, setForm] = useState({
    fullName: "bach",
    phone: "0399279576",
    street: "tran phu",
    commune: "phuoc vih",
    city: "hue",
    notes: "kiet 31",
    defaultAddress: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.phone || !form.street || !form.city) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setLoading(true);

      await addAddress(form);

      router.back();
    } catch (err: any) {
      alert(err.message || "Thêm địa chỉ thất bại");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    key: keyof typeof form,
    placeholder: string
  ) => (
    <View className="gap-1">
      <Text className="text-xs" style={{ color: colors.textMuted }}>
        {label}
      </Text>
      <TextInput
        value={form[key] as string}
        onChangeText={(v) => handleChange(key, v)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted + "80"}
        className="px-3 py-3 rounded-xl text-sm"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          color: colors.text,
        }}
      />
    </View>
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
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
          className="flex-1 text-xl font-bold"
          style={{ color: colors.text }}
        >
          Thêm địa chỉ
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 14 }}
      >
        {renderInput("Họ và tên *", "fullName", "Nguyễn Văn A")}
        {renderInput("Số điện thoại *", "phone", "098xxxxxxx")}
        {renderInput("Địa chỉ (số nhà, đường) *", "street", "123 Lý Thường Kiệt")}
        {renderInput("Phường / Xã", "commune", "Phường 1")}
        {renderInput("Thành phố *", "city", "Huế")}
        {renderInput("Ghi chú", "notes", "Giao giờ hành chính...")}

        {/* Default switch */}
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-sm font-medium" style={{ color: colors.text }}>
            Đặt làm địa chỉ mặc định
          </Text>
          <Switch
            value={form.defaultAddress}
            onValueChange={(v) => handleChange("defaultAddress", v)}
            thumbColor="#fff"
            trackColor={{
              false: colors.border,
              true: colors.primary,
            }}
          />
        </View>
      </ScrollView>

      {/* Submit */}
      <View
        className="px-4 py-4"
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="rounded-2xl py-4 items-center"
          style={{
            backgroundColor: loading ? colors.border : colors.primary,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">
              Lưu địa chỉ
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}