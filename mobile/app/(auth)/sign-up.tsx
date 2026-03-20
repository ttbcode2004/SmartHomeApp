import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import useSocialAuth from "@/hooks/useSocialAuth";
import useTheme from "@/hooks/useTheme";
import { useSignUp } from "@clerk/expo";

export default function SignUpScreen() {
  const { colors } = useTheme();
  const { signUpWithEmail, verifyEmailCode, signInWithOAuth, isLoading } =
    useSocialAuth();
const { signUp } = useSignUp(); 
  const [firstName, setFirstName] = useState("bach");
  const [lastName, setLastName] = useState("bach");
  const [email, setEmail] = useState("13579bach@gmail.com");
  const [password, setPassword] = useState("Tonthatbach@0312");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const handleSignUp = async () => {
  try {
    await signUpWithEmail(email, password, firstName, lastName);
    // Sau khi gọi xong, check signUp.status
    console.log("signUp status:", signUp?.status);
    console.log("signUp unverifiedFields:", signUp?.unverifiedFields);
    console.log("signUp missingFields:", signUp?.missingFields);

    if (
      signUp?.status === "missing_requirements" &&
      signUp?.unverifiedFields.includes("email_address") &&
      signUp?.missingFields.length === 0
    ) {
      console.log("pendingverication", pendingVerification);
      console.log("pendingverication", pendingVerification);
      
      setPendingVerification(true); // ✅ Hiện màn hình OTP
    }
  } catch (err: any) {
    Alert.alert("Lỗi", err?.errors?.[0]?.message ?? err?.message ?? String(err));
  }
};

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        style={{ backgroundColor: colors.bg }}
      >
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-8">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.primary + "22" }}
            >
              <Ionicons
                name="mail-unread-outline"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text
              className="text-2xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Xác nhận email
            </Text>
            <Text
              className="text-sm text-center"
              style={{ color: colors.textMuted }}
            >
              Chúng tôi đã gửi mã xác nhận đến{"\n"}
              <Text className="font-semibold" style={{ color: colors.text }}>
                {email}
              </Text>
            </Text>
          </View>

          <View
            className="flex-row items-center rounded-2xl px-4 gap-3 border mb-4"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.backgrounds.input,
            }}
          >
            <Ionicons
              name="keypad-outline"
              size={18}
              color={colors.textMuted}
            />
            <TextInput
              placeholder="Mã 6 chữ số"
              placeholderTextColor={colors.textMuted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              className="flex-1 py-4 text-sm"
              style={{ color: colors.text }}
            />
          </View>

          <TouchableOpacity
            onPress={() => verifyEmailCode(otp)}
            disabled={isLoading}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: colors.primary }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-16 pb-10">
          {/* Header */}
          <View className="mb-8">
            <Text
              className="text-4xl font-bold mb-1"
              style={{ color: colors.text }}
            >
              Tạo tài khoản
            </Text>
            <Text className="text-base" style={{ color: colors.textMuted }}>
              Đăng ký để bắt đầu
            </Text>
          </View>

          {/* Form */}
          <View className="gap-3 mb-5">
            <View className="flex-row gap-3">
              <View
                className="flex-1 flex-row items-center rounded-xl px-4 gap-3 border"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.backgrounds.input,
                }}
              >
                <TextInput
                  placeholder="Họ"
                  placeholderTextColor={colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                  className="flex-1 py-4 text-base"
                  style={{ color: colors.text }}
                />
              </View>
              <View
                className="flex-1 flex-row items-center rounded-xl px-4 gap-3 border"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.backgrounds.input,
                }}
              >
                <TextInput
                  placeholder="Tên"
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                  className="flex-1 py-4 text-base"
                  style={{ color: colors.text }}
                />
              </View>
            </View>

            <View
              className="flex-row items-center rounded-xl px-4 gap-3 border"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.backgrounds.input,
              }}
            >
              <Ionicons
                name="mail-outline"
                size={22}
                color={colors.textMuted}
              />
              <TextInput
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 py-4 text-base"
                style={{ color: colors.text }}
              />
            </View>

            <View
              className="flex-row items-center rounded-xl px-4 gap-3 border"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.backgrounds.input,
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={colors.textMuted}
              />
              <TextInput
                placeholder="Mật khẩu"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className="flex-1 py-4 text-base"
                style={{ color: colors.text }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={isLoading}
              className="rounded-xl py-4 items-center mt-1"
              style={{ backgroundColor: colors.primary }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Tạo tài khoản
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="flex-row items-center gap-3 mb-5">
            <View
              className="flex-1 h-px"
              style={{ backgroundColor: colors.border }}
            />
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              Hoặc đăng ký với
            </Text>
            <View
              className="flex-1 h-px"
              style={{ backgroundColor: colors.border }}
            />
          </View>

          {/* OAuth Buttons */}
          <View className="gap-3 mb-8">
            {[
              {
                label: "Google",
                icon: "logo-google" as const,
                provider: "google" as const,
                color: colors.text,
              },
              {
                label: "Apple",
                icon: "logo-apple" as const,
                provider: "apple" as const,
                color: colors.text,
              },
              {
                label: "Facebook",
                icon: "logo-facebook" as const,
                provider: "facebook" as const,
                color: "#1877F2",
              },
            ].map(({ label, icon, provider, color }) => (
              <TouchableOpacity
                key={provider}
                onPress={() => signInWithOAuth(provider)}
                activeOpacity={0.75}
                className="flex-row items-center justify-center gap-3 rounded-xl py-3.5 px-5 border"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Ionicons name={icon} size={22} color={color} />
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.text }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-sm" style={{ color: colors.textMuted }}>
              Đã có tài khoản?
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.primary }}
                >
                  Đăng nhập
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
