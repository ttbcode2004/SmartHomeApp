import {
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";
import  { PublicUser } from "@/types";
import { useSocialActions } from "@/hooks/useSocialActions";

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dbUser, getUserById } = useCurrentUser();

  const {
    isFollowing,
    isFriend,
    isFriendRequestSent,
    actionLoading,
    handleToggleFollow,
    handleFriendAction,
    getFriendBtnConfig,
  } = useSocialActions(id);

  const friendBtn = getFriendBtnConfig(colors);

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Local stats (optimistic) ── */
  const [followersCount, setFollowersCount] = useState(0);

  const isFollower =
    dbUser?.followers?.some((f: any) => (f._id ?? f) === id) ?? false;

  /* ── Fetch profile ── */
  /* ── Fetch profile ── */
  useEffect(() => {
    if (!id) return;

    // Nếu là chính mình thì chuyển sang tab profile
    if (dbUser?._id === id) {
      router.replace("/(tabs)/profile");
      return;
    }

    getUserById(id).then((data) => {
      setProfile(data);
      setFollowersCount(data?.followers?.length ?? 0);
      setIsLoading(false);
    });
  }, [id, dbUser?._id]);

  /* ── States ── */
  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        className="flex-1 items-center justify-center gap-3"
        style={{ backgroundColor: colors.bg }}
      >
        <Feather name="user-x" size={48} color={colors.border} />
        <Text style={{ color: colors.textMuted }}>
          Không tìm thấy người dùng
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim() || profile.username;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Back button */}
      <View className="absolute z-10 left-4" style={{ top: insets.top + 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "#00000060" }}
        >
          <Feather name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Banner */}
        <View className="h-44">
          {profile.bannerImage ? (
            <Image
              source={{ uri: profile.bannerImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full h-full"
            />
          )}
          <LinearGradient
            colors={["transparent", colors.bg + "dd"]}
            className="absolute inset-0"
          />
        </View>

        {/* Avatar + Actions */}
        <View className="px-4" style={{ marginTop: -44 }}>
          <View className="flex-row items-flex-end justify-between">
            {/* Avatar */}
            <View
              style={{
                borderWidth: 3,
                borderColor: colors.bg,
                borderRadius: 42,
              }}
            >
              {profile.profilePicture ? (
                <Image
                  source={{ uri: profile.profilePicture }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="user" size={36} color={colors.primary} />
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-2 mt-12">
              {/* Follow */}
              <TouchableOpacity
                onPress={handleToggleFollow}
                disabled={actionLoading}
                className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: isFollowing
                    ? colors.surface
                    : colors.primary,
                  borderWidth: isFollowing ? 1 : 0,
                  borderColor: colors.border,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                <Feather
                  name={isFollowing ? "user-check" : "user-plus"}
                  size={13}
                  color={isFollowing ? colors.text : "#fff"}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: isFollowing ? colors.text : "#fff" }}
                >
                  {isFollowing ? "Đang theo" : "Theo dõi"}
                </Text>
              </TouchableOpacity>

              {/* Friend */}
              <TouchableOpacity
                onPress={handleFriendAction}
                disabled={friendBtn.disabled || actionLoading}
                className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: friendBtn.bgColor,
                  borderWidth: 1,
                  borderColor: friendBtn.color,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                <Feather
                  name={friendBtn.icon as any}
                  size={13}
                  color={friendBtn.color}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: friendBtn.color }}
                >
                  {friendBtn.label}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name / username */}
          <Text
            className="text-xl font-bold mt-3"
            style={{ color: colors.text }}
          >
            {fullName}
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: colors.primary }}>
            @{profile.username}
          </Text>

          {/* Follower badge */}
          {isFollower && !isFriend && (
            <View
              className="self-start mt-1.5 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: colors.textMuted + "18" }}
            >
              <Text className="text-xs" style={{ color: colors.textMuted }}>
                Đang theo dõi bạn
              </Text>
            </View>
          )}

          {profile.bio ? (
            <Text
              className="text-sm mt-3 leading-5"
              style={{ color: colors.textMuted }}
            >
              {profile.bio}
            </Text>
          ) : null}
        </View>

        {/* Stats */}
        <View
          className="mx-4 mt-5 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center py-3">
            {[
              { label: "Bạn bè", value: profile.friends?.length ?? 0 },
              { label: "Đang theo", value: profile.following?.length ?? 0 },
              { label: "Người theo", value: followersCount },
            ].map((stat, i, arr) => (
              <View key={stat.label} className="flex-row flex-1">
                <View className="flex-1 items-center">
                  <Text
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: colors.textMuted }}
                  >
                    {stat.label}
                  </Text>
                </View>
                {i < arr.length - 1 && (
                  <View
                    style={{
                      width: 1,
                      height: 32,
                      backgroundColor: colors.border,
                      alignSelf: "center",
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
