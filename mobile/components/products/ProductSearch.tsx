import { View, TextInput, TouchableOpacity } from "react-native";
import Feather from "@expo/vector-icons/Feather";

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onClear: () => void;
  colors: any;
}

export default function ProductSearch({ value, onChangeText, onClear, colors }: Props) {
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 8,
        paddingHorizontal: 12, paddingVertical: 2,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 12,
      }}
    >
      <Feather name="search" size={15} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Tìm sản phẩm..."
        placeholderTextColor={colors.textMuted + "80"}
        style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text }}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Feather name="x" size={15} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}