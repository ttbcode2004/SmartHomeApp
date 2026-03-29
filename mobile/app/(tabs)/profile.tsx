import {
  View, Text, Image, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert, Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";

import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";
import { StatBox } from "@/components/profile/StatBox";
import { MenuItem } from "@/components/profile/MenuItem";

export default function ProfileScreen() {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const router = useRouter();
  const { dbUser, isLoading } = useCurrentUser();

  const handleSignOut = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const fullName = dbUser
    ? `${dbUser.firstName} ${dbUser.lastName}`.trim() || dbUser.username
    : "—";

  const menuItems = [
    {
      icon: "shopping-bag",
      label: "Đơn hàng của tôi",
      onPress: () => router.push("/(user)/orders"),
    },
    {
      icon: "heart",
      label: "Danh sách yêu thích",
      onPress: () => router.push("/(user)/wishlist"),
      badge: (dbUser?.wishlist?.length ?? 0) > 0 ? dbUser!.wishlist.length : null,
    },
    {
      icon: "shopping-cart",
      label: "Giỏ hàng",
      onPress: () => router.push("/(user)/cart"),
      badge: (dbUser?.cart?.length ?? 0) > 0 ? dbUser!.cart.length : null,
    },
    {
      icon: "map-pin",
      label: "Địa chỉ giao hàng",
      onPress: () => router.push("/(user)/addresses"),
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <Text className="text-xl font-bold tracking-tight" style={{ color: colors.text }}>
          Hồ sơ
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(user)/edit-profile" as any)}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary + "15" }}
        >
          <Feather name="edit-2" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Banner */}
        <View className="h-28 relative">
          {dbUser?.bannerImage ? (
            <Image source={{ uri: dbUser.bannerImage }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full h-full"
            />
          )}
          <LinearGradient colors={["transparent", colors.bg + "cc"]} className="absolute inset-0" />
        </View>

        {/* Avatar + Info */}
        <View className="px-4">
          <View className="flex-row items-flex-end justify-between" style={{ marginTop: -38 }}>
            {/* Avatar */}
            <View
              className="rounded-full"
              style={{
                borderWidth: 3,
                borderColor: colors.bg,
                borderRadius: 42,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {dbUser?.profilePicture ? (
                <Image
                  source={{ uri: dbUser.profilePicture }}
                  style={{ width: 76, height: 76, borderRadius: 38 }}
                />
              ) : (
                <View
                  style={{
                    width: 76, height: 76, borderRadius: 38,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Feather name="user" size={34} color={colors.primary} />
                </View>
              )}
            </View>

            {/* Role badge */}
            {dbUser?.role === "admin" && (
              <View className="px-3 py-1 rounded-full mt-2" style={{ backgroundColor: colors.warning + "20" }}>
                <Text className="text-xs font-semibold" style={{ color: colors.warning }}>Admin</Text>
              </View>
            )}
          </View>

          {/* Name / username / bio */}
          <Text className="text-xl font-bold mt-3" style={{ color: colors.text }}>{fullName}</Text>
          {dbUser?.username && (
            <Text className="text-sm mt-0.5" style={{ color: colors.primary }}>@{dbUser.username}</Text>
          )}
          {dbUser?.bio && (
            <Text className="text-sm mt-2 leading-5" style={{ color: colors.textMuted }}>{dbUser.bio}</Text>
          )}
          <View className="flex-row items-center gap-1.5 mt-1.5">
            <Feather name="mail" size={12} color={colors.textMuted} />
            <Text className="text-xs" style={{ color: colors.textMuted }}>{dbUser?.email}</Text>
          </View>
        </View>

        {/* Stats */}
        <View
          className="mx-4 mt-5 rounded-2xl overflow-hidden flex-row"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          <StatBox label="Bạn bè"     value={dbUser?.friends?.length ?? 0}   colors={colors} onPress={() => router.push("/(user)/friends")} />
          <StatBox label="Đang theo"  value={dbUser?.following?.length ?? 0} colors={colors} onPress={() => router.push("/(user)/following")} />
          <StatBox label="Người theo" value={dbUser?.followers?.length ?? 0} colors={colors} onPress={() => router.push("/(user)/followers")} />
        </View>

        {/* Menu items */}
        <View
          className="mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          {menuItems.map((item, i) => (
            <MenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
              isLast={i === menuItems.length - 1}
              iconColor={colors.primary}
              labelColor={colors.text}
              borderColor={colors.border}
              rightElement={
                item.badge ? (
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white text-xs font-bold">{item.badge}</Text>
                  </View>
                ) : undefined
              }
            />
          ))}
        </View>

        {/* Settings */}
        <View
          className="mx-4 mt-3 rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          <MenuItem
            icon={isDarkMode ? "moon" : "sun"}
            label={isDarkMode ? "Chế độ tối" : "Chế độ sáng"}
            onPress={toggleDarkMode}
            iconColor={colors.warning}
            labelColor={colors.text}
            borderColor={colors.border}
            rightElement={
              <View
                className="w-11 h-6 rounded-full justify-center px-0.5"
                style={{ backgroundColor: isDarkMode ? colors.primary : colors.border }}
              >
                <View
                  className="w-5 h-5 rounded-full bg-white"
                  style={{
                    alignSelf: isDarkMode ? "flex-end" : "flex-start",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                />
              </View>
            }
          />
          <MenuItem
            icon="log-out"
            label="Đăng xuất"
            onPress={handleSignOut}
            isLast
            iconColor={colors.danger}
            labelColor={colors.danger}
            borderColor={colors.border}
            rightElement={<View />}
          />
        </View>

        <Text className="text-center text-xs mt-6" style={{ color: colors.textMuted + "80" }}>
          v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
