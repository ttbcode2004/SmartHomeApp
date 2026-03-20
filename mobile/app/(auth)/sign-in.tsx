import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import useSocialAuth from "@/hooks/useSocialAuth";
import useTheme from "@/hooks/useTheme";

const OAuthButton = ({
  label,
  icon,
  onPress,
  colors,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  colors: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    className="flex-row items-center justify-center gap-3 rounded-xl py-3.5 px-5 border"
    style={{ borderColor: colors.border, backgroundColor: colors.surface }}
  >
    {icon}
    <Text className="text-base font-semibold" style={{ color: colors.text }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function SignInScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    signInWithOAuth,
    signInWithEmail,
    sendPhoneCode,
    verifyPhoneCode,
    isLoading,
    pendingVerification,
  } = useSocialAuth();

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const handleEmailSignIn = () => signInWithEmail(email, password);
  const handleSendCode = () => sendPhoneCode(phone);
  const handleVerifyCode = () => verifyPhoneCode(otp);

  return (
    <ImageBackground
      source={require("@/assets/images/bg.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-12 pb-20">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-4xl font-bold mb-1 text-yellow-600">
                SMART HOME
              </Text>
              <Text className="text-yellow-700 text-xl">
                Đăng nhập để tiếp tục
              </Text>
            </View>

            {/* Tab Switcher */}
            <View
              className="flex-row rounded-xl mb-6"
              style={{ backgroundColor: colors.surface }}
            >
              {(["email", "phone"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTab(t)}
                  className="flex-1 py-2.5 rounded-xl items-center"
                  style={{
                    backgroundColor: tab === t ? colors.primary : "transparent",
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: tab === t ? "#fff" : colors.textMuted }}
                  >
                    {t === "email" ? "Email" : "Số điện thoại"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email Form */}
            {tab === "email" && (
              <View className="gap-6 mb-5">
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
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={handleEmailSignIn}
                  disabled={isLoading}
                  className="rounded-xl py-4 items-center mt-1 "
                  style={{ backgroundColor: colors.primary }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      Đăng nhập
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Phone Form */}
            {tab === "phone" && (
              <View className="gap-3 mb-5">
                {!pendingVerification ? (
                  <>
                    <View
                      className="flex-row items-center rounded-xl px-4 gap-3 border"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.backgrounds.input,
                      }}
                    >
                      <Ionicons
                        name="call-outline"
                        size={22}
                        color={colors.textMuted}
                      />
                      <TextInput
                        placeholder="+84 xxx xxx xxx"
                        placeholderTextColor={colors.textMuted}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        className="flex-1 py-4 text-base"
                        style={{ color: colors.text }}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={handleSendCode}
                      disabled={isLoading}
                      className="rounded-xl py-4 items-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white font-bold text-base">
                          Gửi mã OTP
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text
                      className="text-sm mb-1"
                      style={{ color: colors.textMuted }}
                    >
                      Nhập mã OTP đã gửi đến {phone}
                    </Text>
                    <View
                      className="flex-row items-center rounded-2xl px-4 gap-3 border"
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
                        placeholder="6 chữ số"
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
                      onPress={handleVerifyCode}
                      disabled={isLoading}
                      className="rounded-2xl py-4 items-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white font-bold text-base">
                          Xác nhận
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Divider */}
            <View className="flex-row items-center gap-3 mb-5">
              <View
                className="flex-1 h-px"
                style={{ backgroundColor: colors.border }}
              />
              <Text className="text-sm" style={{ color: colors.textMuted }}>
                Hoặc tiếp tục với
              </Text>
              <View
                className="flex-1 h-px"
                style={{ backgroundColor: colors.border }}
              />
            </View>

            {/* OAuth Buttons */}
            <View className="gap-3 mb-8">
              <OAuthButton
                label="Google"
                icon={
                  <Ionicons name="logo-google" size={22} color={colors.text} />
                }
                onPress={() => signInWithOAuth("google")}
                colors={colors}
              />
              <OAuthButton
                label="Apple"
                icon={
                  <Ionicons name="logo-apple" size={22} color={colors.text} />
                }
                onPress={() => signInWithOAuth("apple")}
                colors={colors}
              />
              <OAuthButton
                label="Facebook"
                icon={
                  <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                }
                onPress={() => signInWithOAuth("facebook")}
                colors={colors}
              />
            </View>

            {/* Footer */}
            <View className="flex-row justify-center gap-1">
              <Text className="text-sm" style={{ color: colors.textMuted }}>
                Chưa có tài khoản?
              </Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.primary }}
                  >
                    Đăng ký ngay
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
