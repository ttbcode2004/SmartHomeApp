import { Stack } from "expo-router";
import useTheme from "@/hooks/useTheme";

export default function ProductLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    />
  );
}