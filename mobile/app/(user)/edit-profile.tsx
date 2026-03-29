import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator,
  Alert, Image, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";

/* ─── Types ───────────────────────────────────────── */
type FormField = "firstName" | "lastName" | "username" | "bio" | "profilePicture" | "bannerImage";

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  profilePicture: string;
  bannerImage: string;
}

/* ─── InputField ──────────────────────────────────── */
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  colors: any;
}) => (
  <View className="gap-1.5">
    <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted + "80"}
      multiline={multiline}
      maxLength={maxLength}
      style={{
        backgroundColor: colors.backgrounds.editInput,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        minHeight: multiline ? 90 : undefined,
        textAlignVertical: multiline ? "top" : "center",
      }}
    />
    {maxLength && (
      <Text className="text-xs text-right" style={{ color: colors.textMuted }}>
        {value.length}/{maxLength}
      </Text>
    )}
  </View>
);

/* ─── EditProfileScreen ───────────────────────────── */
export default function EditProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dbUser, isLoading, updateMe } = useCurrentUser();

// Thay useState form hiện tại thành:
const [form, setForm] = useState<FormState>({
  firstName:      "",
  lastName:       "",
  username:       "",
  bio:            "",
  profilePicture: "",
  bannerImage:    "",
});

// Thêm useEffect sync khi dbUser sẵn sàng
useEffect(() => {
  if (!dbUser) return;
  setForm({
    firstName:      dbUser.firstName      ?? "",
    lastName:       dbUser.lastName       ?? "",
    username:       dbUser.username       ?? "",
    bio:            dbUser.bio            ?? "",
    profilePicture: dbUser.profilePicture ?? "",
    bannerImage:    dbUser.bannerImage    ?? "",
  });
}, [dbUser?._id]);

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<"profilePicture" | "bannerImage" | null>(null);

  const set = (field: FormField) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ─── Image picker + upload ─── */
  const pickImage = async (field: "profilePicture" | "bannerImage") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền truy cập", "Vui lòng cho phép truy cập thư viện ảnh.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === "profilePicture" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (result.canceled) return;

    // Lưu local URI để preview, upload thật khi nhấn Lưu
    set(field)(result.assets[0].uri);
  };

  /* ─── Save ─── */
const handleSave = async () => {
    if (!form.firstName.trim()) {
      Alert.alert("Thiếu thông tin", "Họ không được để trống.");
      return;
    }
    if (form.username.trim().length < 3) {
      Alert.alert("Username không hợp lệ", "Username phải có ít nhất 3 ký tự.");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName.trim());
      formData.append("lastName",  form.lastName.trim());
      formData.append("username",  form.username.trim());
      formData.append("bio",       form.bio.trim());

      // Chỉ append file nếu là local URI (ảnh mới), bỏ qua nếu là URL Cloudinary cũ
      if (form.profilePicture && !form.profilePicture.startsWith("http")) {
        formData.append("profilePicture", {
          uri:  form.profilePicture,
          name: "avatar.jpg",
          type: "image/jpeg",
        } as any);
      }
      if (form.bannerImage && !form.bannerImage.startsWith("http")) {
        formData.append("bannerImage", {
          uri:  form.bannerImage,
          name: "banner.jpg",
          type: "image/jpeg",
        } as any);
      }

      const result = await updateMe(formData);
      if (result) {
        router.back();
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật. Thử lại sau.");
      }
    } catch {
      Alert.alert("Lỗi", "Đã xảy ra lỗi. Thử lại sau.");
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ backgroundColor: colors.bg }}
    >
      <View style={{ paddingTop: insets.top, flex: 1 }}>
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
            <Feather name="x" size={18} color={colors.text} />
          </TouchableOpacity>

          <Text className="flex-1 text-xl font-bold tracking-tight" style={{ color: colors.text }}>
            Chỉnh sửa hồ sơ
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-sm font-semibold text-white">Lưu</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── Banner ── */}
          <View className="relative">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => pickImage("bannerImage")}
              className="h-32 w-full"
              style={{ backgroundColor: colors.primary + "25" }}
            >
              {form.bannerImage ? (
                <Image
                  source={{ uri: form.bannerImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : null}

              {/* Overlay */}
              <View
                className="absolute inset-0 items-center justify-center gap-1"
                style={{ backgroundColor: "#00000040" }}
              >
                {uploadingField === "bannerImage" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="camera" size={20} color="#fff" />
                    <Text className="text-xs font-medium text-white">Đổi ảnh bìa</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* ── Avatar (overlap banner) ── */}
            <View className="absolute left-4" style={{ bottom: -38 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => pickImage("profilePicture")}
                style={{
                  width: 76, height: 76, borderRadius: 38,
                  borderWidth: 3, borderColor: colors.bg,
                  backgroundColor: colors.primary + "20",
                  overflow: "hidden",
                }}
              >
                {form.profilePicture ? (
                  <Image
                    source={{ uri: form.profilePicture }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Feather name="user" size={30} color={colors.primary} />
                  </View>
                )}

                {/* Overlay */}
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: "#00000050" }}
                >
                  {uploadingField === "profilePicture" ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Feather name="camera" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Spacer for avatar overlap */}
          <View className="mt-14 px-4 gap-5">
            {/* Name row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField
                  label="Họ"
                  value={form.firstName}
                  onChangeText={set("firstName")}
                  placeholder="Nguyễn"
                  colors={colors}
                />
              </View>
              <View className="flex-1">
                <InputField
                  label="Tên"
                  value={form.lastName}
                  onChangeText={set("lastName")}
                  placeholder="Văn A"
                  colors={colors}
                />
              </View>
            </View>

            {/* Username */}
            <InputField
              label="Username"
              value={form.username}
              onChangeText={set("username")}
              placeholder="username_cua_ban"
              maxLength={30}
              colors={colors}
            />

            {/* Bio */}
            <InputField
              label="Giới thiệu"
              value={form.bio}
              onChangeText={set("bio")}
              placeholder="Viết vài dòng về bản thân..."
              multiline
              maxLength={150}
              colors={colors}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}