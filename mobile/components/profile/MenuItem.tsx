import { TouchableOpacity, View, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";

type Props = {
  icon: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
  iconColor: string;
  labelColor: string;
  borderColor: string;
  rightElement?: React.ReactNode;
};

export function MenuItem({
  icon,
  label,
  onPress,
  isLast = false,
  iconColor,
  labelColor,
  borderColor,
  rightElement,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={onPress}
      className="flex-row items-center px-4 py-[14px] gap-3"
      style={!isLast ? { borderBottomWidth: 1, borderBottomColor: borderColor } : undefined}
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: iconColor + "18" }}
      >
        <Feather name={icon as any} size={15} color={iconColor} />
      </View>
      <Text className="flex-1 text-sm font-medium" style={{ color: labelColor }}>
        {label}
      </Text>
      {rightElement ?? (
        <Feather name="chevron-right" size={15} color={labelColor + "60"} />
      )}
    </TouchableOpacity>
  );
}