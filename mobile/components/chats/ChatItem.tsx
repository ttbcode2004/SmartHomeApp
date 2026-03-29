import { Chat } from "@/types";
import { Image } from "expo-image";
import { View, Text, Pressable } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { useSocketStore } from "@/lib/socket";
import useTheme from "@/hooks/useTheme";

const ChatItem = ({ chat, onPress }: { chat: Chat; onPress: () => void }) => {
  const participant = chat.participant;

  const { onlineUsers, typingUsers, unreadChats } = useSocketStore();
  const { colors } = useTheme();

  const isOnline = onlineUsers.has(participant._id);
  const isTyping = typingUsers.get(chat._id) === participant._id;
  const hasUnread = unreadChats.has(chat._id);

  return (
    <Pressable
      className="flex-row items-center py-3 active:opacity-70"
      onPress={onPress}
    >
      {/* avatar & online indicator */}
      <View className="relative">
        <Image
          source={{ uri: participant.profilePicture }}
          style={{ width: 56, height: 56, borderRadius: 999 }}
        />

        {isOnline && (
          <View
            style={{
              backgroundColor: colors.success,
              borderColor: colors.surface,
            }}
            className="absolute bottom-0 right-0 size-4 rounded-full border-[3px]"
          />
        )}
      </View>

      {/* chat info */}
      <View className="flex-1 ml-4">
        <View className="flex-row items-center justify-between">
          <Text
            style={{
              color: hasUnread ? colors.primary : colors.text,
            }}
            className="text-base font-medium"
          >
            {participant.username}
          </Text>

          <View className="flex-row items-center gap-2">
            {hasUnread && (
              <View
                style={{ backgroundColor: colors.primary }}
                className="w-2.5 h-2.5 rounded-full"
              />
            )}

            <Text
              style={{ color: colors.textMuted }}
              className="text-xs"
            >
              {chat.lastMessageAt
                ? formatDistanceToNow(new Date(chat.lastMessageAt), {
                    addSuffix: false,
                  })
                : ""}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-1">
          {isTyping ? (
            <Text
              style={{ color: colors.primary }}
              className="text-sm italic"
            >
              typing...
            </Text>
          ) : (
            <Text
              style={{
                color: hasUnread ? colors.text : colors.textMuted,
                fontWeight: hasUnread ? "500" : "normal",
              }}
              className="text-sm flex-1 mr-3"
              numberOfLines={1}
            >
              {chat.lastMessage?.text || "No messages yet"}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default ChatItem;