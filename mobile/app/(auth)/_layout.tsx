import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/expo";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  // Đã đăng nhập → vào tabs
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}