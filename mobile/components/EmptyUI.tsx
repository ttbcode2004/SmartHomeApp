import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import useTheme from "@/hooks/useTheme";

type EmptyUIProps = {
  title: string;
  subtitle?: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  iconSize?: number;
  buttonLabel?: string;
  onPressButton?: () => void;
};

function EmptyUI({
  title,
  subtitle,
  iconName = "chatbubbles-outline",
  iconColor,
  iconSize = 64,
  buttonLabel,
  onPressButton,
}: EmptyUIProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-1 items-center justify-center py-20">
      {iconName && (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={iconColor || colors.textMuted}
        />
      )}

      <Text
        style={{ color: colors.textMuted }}
        className="text-lg mt-4"
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{ color: colors.textMuted }}
          className="text-sm mt-1"
        >
          {subtitle}
        </Text>
      ) : null}

      {buttonLabel && onPressButton ? (
        <Pressable
          style={{ backgroundColor: colors.primary }}
          className="mt-6 px-6 py-3 rounded-full"
          onPress={onPressButton}
        >
          <Text
            style={{ color: "#fff" }}
            className="font-semibold"
          >
            {buttonLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default EmptyUI;