import { Slot, Stack } from "expo-router";
import "../global.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();


const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ClerkLoaded>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
      </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
