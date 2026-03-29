import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  value: number;
  colors: any;
  onPress?: () => void;
};

export function StatBox({ label, value, colors, onPress }: Props) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center py-1 active:opacity-70">
      <Text className="text-lg font-bold" style={{ color: colors.text }}>
        {value}
      </Text>
      <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}