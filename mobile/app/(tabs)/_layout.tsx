import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/build/Feather";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1DA1F2",
        tabBarInactiveTintColor: "#657786",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E1E8ED",
          height: 50 + insets.bottom,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "",

          tabBarIcon: ({ color, size }) => <Feather name="plus" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}