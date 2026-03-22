// app/two-factor.tsx
import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity } from "react-native";

export default function TwoFactorScreen() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleVerify = async () => {
  if (!signIn) return;
  try {
    // ✅ Đúng method cho Clerk v3
    const { error } = await signIn.verifyMFAEmailCode({ code });

    if (error) {
      Alert.alert("Sai mã", error.message ?? "Mã xác thực không đúng.");
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          router.replace("/(tabs)");
        },
      });
    }
  } catch (err: any) {
    Alert.alert("Lỗi", err?.errors?.[0]?.message ?? "Có lỗi xảy ra.");
  }
};

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>Xác thực 2 bước</Text>
      <Text style={{ color: "#666", marginBottom: 24 }}>
        Nhập mã từ ứng dụng Authenticator
      </Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, fontSize: 24, textAlign: "center" }}
      />
      <TouchableOpacity
        onPress={handleVerify}
        style={{ marginTop: 16, backgroundColor: "#000", padding: 14, borderRadius: 8, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Xác nhận</Text>
      </TouchableOpacity>
    </View>
  );
}