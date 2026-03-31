import { Animated, View, Text } from "react-native";
import type { ToastState } from "@/hooks/useToast";
import { TOAST_CONFIG } from "@/hooks/useToast";

interface ToastProps {
  toast:   ToastState;
  opacity: Animated.Value;
}

export default function Toast({ toast, opacity }: ToastProps) {
  if (!toast.visible) return null;

  const { icon, bgColor, iconBg } = TOAST_CONFIG[toast.type];

  return (
    <Animated.View
      style={{ opacity, backgroundColor: bgColor }}
      className="absolute top-1 left-1 right-1 rounded-2xl flex-row items-center gap-3 px-4 py-3 shadow-lg z-50"
    >
      {/* Icon badge */}
      <View
        style={{ backgroundColor: iconBg }}
        className="w-7 h-7 rounded-full items-center justify-center shrink-0"
      >
        <Text className="text-white text-sm font-bold">{icon}</Text>
      </View>

      {/* Text */}
      <View className="flex-1">
        <Text className="text-white text-xs font-semibold" numberOfLines={1}>
          {toast.message}
        </Text>
        {toast.description ? (
          <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
            {toast.description}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}