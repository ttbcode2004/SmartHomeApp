import EmptyUI from "@/components/EmptyUI";
import MessageBubble from "@/components/messages/MessageBubble";
import useCurrentUser from "@/hooks/useCurrentUser";
import useMessages from "@/hooks/useMessages";
import { useSocketStore } from "@/lib/socket";
import { MessageSender } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useTheme from "@/hooks/useTheme";

type ChatParams = {
  id: string;
  participantId: string;
  username: string;
  profilePicture: string;
};

const ChatDetailScreen = () => {
  const { colors } = useTheme();

  const {
    id: chatId,
    profilePicture,
    username,
    participantId,
  } = useLocalSearchParams<ChatParams>();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { dbUser: currentUser } = useCurrentUser();
  const { messages, isLoading } = useMessages(chatId);

  const {
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    isConnected,
    onlineUsers,
    typingUsers,
  } = useSocketStore();

  const isOnline = participantId
    ? onlineUsers.has(participantId)
    : false;
  const isTyping = typingUsers.get(chatId) === participantId;

  const typingTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (chatId && isConnected) joinChat(chatId);
    return () => {
      if (chatId) leaveChat(chatId);
    };
  }, [chatId, isConnected, joinChat, leaveChat]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleTyping = useCallback(
    (text: string) => {
      setMessageText(text);

      if (!isConnected || !chatId) return;

      if (text.length > 0) {
        sendTyping(chatId, true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(chatId, false);
        }, 2000);
      } else {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        sendTyping(chatId, false);
      }
    },
    [chatId, isConnected, sendTyping]
  );

  const handleSend = () => {
    if (!messageText.trim() || isSending || !isConnected || !currentUser)
      return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping(chatId, false);

    setIsSending(true);

    sendMessage(chatId, messageText.trim(), {
      _id: currentUser._id,
      name: currentUser.firstName,
      email: currentUser.email,
      avatar: currentUser.profilePicture,
    });

    setMessageText("");
    setIsSending(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.bg }}
      className="flex-1"
      edges={["top", "bottom"]}
    >
      {/* HEADER */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }}
        className="flex-row items-center px-4 py-2 border-b"
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.primary}
          />
        </Pressable>

        <View className="flex-row items-center flex-1 ml-2">
          {profilePicture && (
            <Image
              source={profilePicture}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
              }}
            />
          )}

          <View className="ml-3">
            <Text
              style={{ color: colors.text }}
              className="font-semibold text-base"
              numberOfLines={1}
            >
              {username}
            </Text>

            <Text
              style={{
                color: isTyping
                  ? colors.primary
                  : colors.textMuted,
              }}
              className="text-xs"
            >
              {isTyping
                ? "typing..."
                : isOnline
                ? "Online"
                : "Offline"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable className="w-9 h-9 items-center justify-center">
            <Ionicons
              name="call-outline"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
          <Pressable className="w-9 h-9 items-center justify-center">
            <Ionicons
              name="videocam-outline"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      {/* BODY */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{ backgroundColor: colors.surface }}
          className="flex-1"
        >
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />
            </View>
          ) : !messages || messages.length === 0 ? (
            <EmptyUI
              title="No messages yet"
              subtitle="Start the conversation!"
              iconName="chatbubbles-outline"
              iconColor={colors.textMuted}
              iconSize={64}
            />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: 8,
              }}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({
                  animated: false,
                });
              }}
            >
              {messages.map((message) => {
                const senderId = (message.sender as MessageSender)._id;
                const isFromMe = currentUser
                  ? senderId === currentUser._id
                  : false;

                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isFromMe={isFromMe}
                  />
                );
              })}
            </ScrollView>
          )}

          {/* INPUT */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            }}
            className="px-3 pb-3 pt-2 border-t"
          >
            <View
              style={{
                backgroundColor: colors.backgrounds.input,
              }}
              className="flex-row items-end rounded-3xl px-3 py-1.5 gap-2"
            >
              <Pressable className="w-8 h-8 items-center justify-center">
                <Ionicons
                  name="add"
                  size={22}
                  color={colors.primary}
                />
              </Pressable>

              <TextInput
                placeholder="Type a message"
                placeholderTextColor={colors.textMuted}
                style={{
                  color: colors.text,
                  maxHeight: 100,
                }}
                className="flex-1 text-sm mb-2"
                multiline
                value={messageText}
                onChangeText={handleTyping}
                onSubmitEditing={handleSend}
                editable={!isSending}
              />

              <Pressable
                onPress={handleSend}
                disabled={!messageText.trim() || isSending}
                style={{
                  backgroundColor: colors.primary,
                  opacity:
                    !messageText.trim() || isSending ? 0.5 : 1,
                }}
                className="w-8 h-8 rounded-full items-center justify-center"
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name="send"
                    size={18}
                    color="#fff"
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;