import { Slot, Stack } from "expo-router";
import "../global.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import * as WebBrowser from "expo-web-browser";
import * as Sentry from "@sentry/react-native";

import SocketConnection from "@/components/SocketConnection";

Sentry.init({
  dsn: "https://9a4c46b28c592db5dc16aa66e47b2098@o4511093615820800.ingest.us.sentry.io/4511127732158464",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default Sentry.wrap(function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SocketConnection />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
});
