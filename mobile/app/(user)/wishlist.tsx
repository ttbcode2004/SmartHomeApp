import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StatusBar, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";

export default function WishlistScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dbUser, isLoading, removeFromWishlist } = useCurrentUser();
  
  const wishlist = dbUser?.wishlist ?? [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surface }}
        >
          <Feather name="arrow-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold tracking-tight" style={{ color: colors.text }}>
          Yêu thích
        </Text>
        {wishlist.length > 0 && (
          <View
            className="w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.danger + "20" }}
          >
            <Text className="text-xs font-bold" style={{ color: colors.danger }}>
              {wishlist.length}
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Feather name="heart" size={52} color={colors.border} />
          <Text className="text-base font-medium" style={{ color: colors.textMuted }}>
            Chưa có sản phẩm yêu thích
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          {wishlist.map((item) => (
            <TouchableOpacity
              activeOpacity={0.85}
              key={item.product}
              className="flex-row items-center gap-3 p-3 rounded-2xl"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={() =>
                router.push({ pathname: "/(product)/productDetails", params: { id: item.product } } as any)
              }
            >
              {/* Image */}
              <Image
                source={{ uri: item.image }}
                className="w-16 h-16 rounded-xl"
                resizeMode="cover"
                style={{ backgroundColor: colors.border }}
              />

              {/* Info */}
              <View className="flex-1 gap-1">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.text }}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                  {item.finalPrice.toLocaleString("vi-VN")}đ
                </Text>
              </View>

              {/* Remove */}
              <TouchableOpacity
                onPress={() => removeFromWishlist(item.product)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.danger + "15" }}
              >
                <Feather name="trash-2" size={14} color={colors.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}