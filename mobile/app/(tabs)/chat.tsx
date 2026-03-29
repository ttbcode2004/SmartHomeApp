import ChatItem from "@/components/chats/ChatItem";
import EmptyUI from "@/components/EmptyUI";
import { useChats } from "@/hooks/useChats";
import { Chat } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import useTheme from "@/hooks/useTheme";

const ChatsTab = () => {
  const router = useRouter();
  const { chats, isLoading, error } = useChats();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View
        style={{ backgroundColor: colors.bg }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{ backgroundColor: colors.bg }}
        className="flex-1 items-center justify-center"
      >
        <Text
          style={{ color: colors.danger }}
          className="text-xl font-semibold"
        >
          Failed to load chats
        </Text>

        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: colors.primary }}
          className="mt-4 px-4 py-2 rounded-lg"
        >
          <Text style={{ color: "#fff" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const handleChatPress = (chat: Chat) => {
    router.push({
      pathname: "/(chat)/[id]",
      params: {
        id: chat._id,
        participantId: chat.participant._id,
        username: chat.participant.username,
        profilePicture: chat.participant.profilePicture,
      },
    });
  };

  return (
    <View style={{ backgroundColor: colors.bg }} className="flex-1">
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ChatItem chat={item} onPress={() => handleChatPress(item)} />
        )}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={
          <EmptyUI
            title="No chats yet"
            subtitle="Start a conversation!"
            iconName="chatbubbles-outline"
            iconColor={colors.textMuted}
            iconSize={64}
            buttonLabel="New Chat"
            onPressButton={() => router.push("/(chat)/new-chat")}
          />
        }
      />
    </View>
  );
};

function Header() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View className="px-5 pt-2 pb-4">
      <View className="flex-row items-center justify-between">
        <Text
          style={{ color: colors.text }}
          className="text-2xl font-bold"
        >
          Chats
        </Text>

        <Pressable
          style={{ backgroundColor: colors.primary }}
          className="size-10 rounded-full items-center justify-center"
          onPress={() => router.push("/(chat)/new-chat")}
        >
          <Ionicons name="create-outline" size={20} color="#0D0D0F" />
        </Pressable>
      </View>
    </View>
  );
}

export default ChatsTab;