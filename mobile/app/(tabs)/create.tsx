import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useProducts, { Category } from "@/hooks/useProducts";

const CATEGORIES: { label: string; value: Category; icon: keyof typeof Feather.glyphMap }[] = [
  { label: "Điều khiển", value: "control", icon: "sliders" },
  { label: "Đèn LED", value: "led", icon: "zap" },
  { label: "Điện", value: "electric", icon: "cpu" },
  { label: "Rèm", value: "curtain", icon: "menu" },
  { label: "Điều hòa", value: "air-conditioner", icon: "wind" },
  { label: "Camera", value: "camera", icon: "camera" },
];

interface FormState {
  name: string;
  summary: string;
  description: string;
  price: string;
  stock: string;
  category: Category | "";
}

const INIT_FORM: FormState = {
  name: "",
  summary: "",
  description: "",
  price: "",
  stock: "",
  category: "",
};

/* ─── Field wrapper ───────────────────────────────── */
const Field = ({
  label,
  required,
  error,
  colors,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  colors: any;
  children: React.ReactNode;
}) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: colors.text }}>
      {label}
      {required && <Text style={{ color: colors.danger }}> *</Text>}
    </Text>
    {children}
    {error ? (
      <Text style={{ fontSize: 12, marginTop: 4, color: colors.danger }}>{error}</Text>
    ) : null}
  </View>
);

/* ─── CreateScreen ────────────────────────────────── */
export default function CreateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createProduct, isSubmitting } = useProducts();

  const [form, setForm] = useState<FormState>(INIT_FORM);
  const [images, setImages] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "images", string>>>({});

  const set = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  /* ── Validate ── */
  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Tên sản phẩm không được trống";
    if (!form.summary.trim()) e.summary = "Mô tả ngắn không được trống";
    if (!form.description.trim()) e.description = "Mô tả chi tiết không được trống";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      e.price = "Giá phải là số dương";
    if (!form.category) e.category = "Vui lòng chọn danh mục";
    if (images.length === 0) e.images = "Cần ít nhất 1 ảnh";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Pick images ── */
  const pickImages = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Quyền truy cập", "Cần cấp quyền thư viện ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      const picked = result.assets.map((a) => ({
        uri: a.uri,
        type: a.mimeType ?? "image/jpeg",
        name: a.fileName ?? `img_${Date.now()}.jpg`,
      }));
      setImages((prev) => [...prev, ...picked].slice(0, 10));
      setErrors((prev) => ({ ...prev, images: undefined }));
    }
  }, []);

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validate()) return;
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("summary", form.summary.trim());
    fd.append("description", form.description.trim());
    fd.append("price", form.price);
    fd.append("stock", form.stock || "0");
    fd.append("category", form.category);
    images.forEach((img) => {
      fd.append("images", { uri: img.uri, type: img.type, name: img.name } as any);
    });

    const result = await createProduct(fd);
    if (result) {
      Alert.alert("Thành công", "Sản phẩm đã được tạo!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Lỗi", "Không thể tạo sản phẩm. Thử lại.");
    }
  };

  /* ── Shared input style ── */
  const inputStyle = {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    backgroundColor: colors.backgrounds.input,
    borderColor: colors.border,
    color: colors.text,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
          Tạo sản phẩm
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 18,
            paddingVertical: 7,
            borderRadius: 20,
            minWidth: 60,
            alignItems: "center",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Đăng</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Images */}
        <Field label="Hình ảnh" required error={errors.images} colors={colors}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10, paddingVertical: 4 }}>
              {/* Add button */}
              <TouchableOpacity
                onPress={pickImages}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  borderColor: errors.images ? colors.danger : colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Feather name="plus" size={24} color={colors.primary} />
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{images.length}/10</Text>
              </TouchableOpacity>

              {/* Previews */}
              {images.map((img, idx) => (
                <View
                  key={idx}
                  style={{ width: 88, height: 88, borderRadius: 12, overflow: "hidden", position: "relative" }}
                >
                  <Image source={{ uri: img.uri }} style={{ width: "100%", height: "100%" }} />
                  <TouchableOpacity
                    onPress={() => removeImage(idx)}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderRadius: 10,
                      padding: 3,
                    }}
                  >
                    <Feather name="x" size={12} color="#fff" />
                  </TouchableOpacity>
                  {idx === 0 && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        backgroundColor: "rgba(59,130,246,0.85)",
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>Chính</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </Field>

        {/* Name */}
        <Field label="Tên sản phẩm" required error={errors.name} colors={colors}>
          <TextInput
            style={inputStyle}
            value={form.name}
            onChangeText={set("name")}
            placeholder="Nhập tên sản phẩm..."
            placeholderTextColor={colors.textMuted}
            maxLength={100}
          />
        </Field>

        {/* Summary */}
        <Field label="Mô tả ngắn" required error={errors.summary} colors={colors}>
          <TextInput
            style={inputStyle}
            value={form.summary}
            onChangeText={set("summary")}
            placeholder="Một câu mô tả ngắn gọn..."
            placeholderTextColor={colors.textMuted}
            maxLength={200}
          />
        </Field>

        {/* Description */}
        <Field label="Mô tả chi tiết" required error={errors.description} colors={colors}>
          <TextInput
            style={[inputStyle, { minHeight: 110, textAlignVertical: "top" }]}
            value={form.description}
            onChangeText={set("description")}
            placeholder="Mô tả đầy đủ về sản phẩm..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
          />
        </Field>

        {/* Price & Stock */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Giá (₫)" required error={errors.price} colors={colors}>
              <TextInput
                style={inputStyle}
                value={form.price}
                onChangeText={set("price")}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Tồn kho" colors={colors}>
              <TextInput
                style={inputStyle}
                value={form.stock}
                onChangeText={set("stock")}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </Field>
          </View>
        </View>

        {/* Category */}
        <Field label="Danh mục" required error={errors.category} colors={colors}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {CATEGORIES.map((cat) => {
              const active = form.category === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => {
                    setForm((prev) => ({ ...prev, category: cat.value }));
                    setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 10,
                    borderWidth: 1,
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  }}
                >
                  <Feather
                    name={cat.icon}
                    size={16}
                    color={active ? "#fff" : colors.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: active ? "#fff" : colors.text,
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}