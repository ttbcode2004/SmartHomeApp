import {
  View, Text, StatusBar, ActivityIndicator,
  FlatList, TextInput, TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import Feather from "@expo/vector-icons/Feather";

import useTheme from "@/hooks/useTheme";
import useCurrentUser from "@/hooks/useCurrentUser";
import { type UserCardUser } from "@/components/UserCard";
import FollowerItem from "@/components/users/FollowerItem";

export default function FollowersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { dbUser, getFollowers } = useCurrentUser();

  const [followers, setFollowers] = useState<UserCardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* ── Fetch ── */
  useEffect(() => {
    if (!dbUser?._id) return;

    getFollowers(dbUser._id)
      .then((data) => {
        setFollowers(data as unknown as UserCardUser[]);
      })
      .finally(() => setIsLoading(false));
  }, [dbUser?._id]);

  /* ── Filter ── */
  const filtered = useMemo(() =>
    followers.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.username}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ), [followers, search]);

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
    >
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

        <Text
          className="flex-1 text-xl font-bold tracking-tight"
          style={{ color: colors.text }}
        >
          Người theo dõi
        </Text>

        <View
          className="w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary + "20" }}
        >
          <Text className="text-xs font-bold" style={{ color: colors.primary }}>
            {followers.length}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View className="px-4 py-3">
        <View
          className="flex-row items-center gap-2 px-3 rounded-xl"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Feather name="search" size={15} color={colors.textMuted} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm người theo dõi..."
            placeholderTextColor={colors.textMuted + "80"}
            className="flex-1 py-2.5 text-sm"
            style={{ color: colors.text }}
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Feather name="user" size={52} color={colors.border} />
          <Text style={{ color: colors.textMuted }}>
            {search ? "Không tìm thấy" : "Chưa có người theo dõi"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FollowerItem
              user={item}
              colors={colors}
              onRemove={() =>
                setFollowers((prev) =>
                  prev.filter((u) => u._id !== item._id)
                )
              }
            />
          )}
        />
      )}
    </View>
  );
}