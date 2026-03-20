import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@clerk/expo";
import useUserSync from "@/hooks/useUserSync";

export default function TabsLayout() {
  const { isSignedIn } = useAuth();
const { dbUser, isSyncing, syncError } = useUserSync();
  // Chưa đăng nhập → về trang sign-in
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* các tab của bạn */}
    </Tabs>
  );
}