import UserItem from "@/components/UserItem";
import { useGetOrCreateChat } from "@/hooks/useChats";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useSocketStore } from "@/lib/socket";
import { PublicUser } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useTheme from "@/hooks/useTheme";

const NewChatScreen = () => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const { dbUser, isLoading, getFriends } = useCurrentUser();
  const { getOrCreateChat, isLoading: isCreatingChat } = useGetOrCreateChat();
  const { onlineUsers } = useSocketStore();

  const [friends, setFriends] = useState<PublicUser[]>([]);

  useEffect(() => {
    if (!dbUser?._id) return;

    getFriends(dbUser._id).then((data) => {
      setFriends(data || []);
    });
  }, [dbUser]);

  const users = useMemo(() => {
    if (!searchQuery.trim()) return friends;

    const query = searchQuery.toLowerCase();

    return friends.filter((u) => {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const username = u.username?.toLowerCase() || "";

      return name.includes(query) || username.includes(query);
    });
  }, [friends, searchQuery]);

  const handleUserSelect = async (user: PublicUser) => {
    const chat = await getOrCreateChat(user._id);
    if (!chat) return;

    router.back();

    setTimeout(() => {
      router.push({
        pathname: "/[id]",
        params: {
          id: chat._id,
          participantId: chat.participant._id,
          username: chat.participant.username,
          profilePicture: chat.participant.profilePicture,
        },
      });
    }, 100);
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.bg }}
      className="flex-1"
      edges={["top"]}
    >
      {/* overlay */}
      <View
        style={{ backgroundColor: colors.bg }}
        className="flex-1 justify-end"
      >
        {/* modal */}
        <View
          style={{ backgroundColor: colors.surface }}
          className="rounded-t-3xl h-[100%] overflow-hidden"
        >
          {/* HEADER */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            }}
            className="px-5 pt-3 pb-3 border-b flex-row items-center"
          >
            <Pressable
              onPress={() => router.back()}
              style={{ backgroundColor: colors.backgrounds.input }}
              className="w-9 h-9 rounded-full items-center justify-center mr-2"
            >
              <Ionicons name="close" size={20} color={colors.primary} />
            </Pressable>

            <View className="flex-1">
              <Text
                style={{ color: colors.text }}
                className="text-xl font-semibold"
              >
                New chat
              </Text>
              <Text
                style={{ color: colors.textMuted }}
                className="text-xs mt-0.5"
              >
                Search for a user to start chatting
              </Text>
            </View>
          </View>

          {/* SEARCH */}
          <View
            style={{ backgroundColor: colors.surface }}
            className="px-5 pt-3 pb-2"
          >
            <View
              style={{
                backgroundColor: colors.backgrounds.input,
                borderColor: colors.border,
              }}
              className="flex-row items-center rounded-full px-3 py-1.5 gap-2 border"
            >
              <Ionicons
                name="search"
                size={18}
                color={colors.textMuted}
              />

              <TextInput
                placeholder="Search users"
                placeholderTextColor={colors.textMuted}
                style={{ color: colors.text }}
                className="flex-1 text-sm"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* LIST */}
          <View
            style={{ backgroundColor: colors.surface }}
            className="flex-1"
          >
            {isCreatingChat || isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                />
              </View>
            ) : users.length === 0 ? (
              <View className="flex-1 items-center justify-center px-5">
                <Ionicons
                  name="person-outline"
                  size={64}
                  color={colors.textMuted}
                />

                <Text
                  style={{ color: colors.text }}
                  className="text-lg mt-4"
                >
                  No users found
                </Text>

                <Text
                  style={{ color: colors.textMuted }}
                  className="text-sm mt-1 text-center"
                >
                  Try a different search term
                </Text>
              </View>
            ) : (
              <ScrollView
                className="flex-1 px-5 pt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                <Text
                  style={{ color: colors.textMuted }}
                  className="text-xs mb-3"
                >
                  FRIENDS
                </Text>

                {users.map((user) => (
                  <UserItem
                    key={user._id}
                    user={user}
                    isOnline={onlineUsers.has(user._id)}
                    onPress={() => handleUserSelect(user)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NewChatScreen;