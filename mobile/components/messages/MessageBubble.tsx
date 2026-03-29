import { Message } from "@/types";
import { View, Text } from "react-native";
import useTheme from "@/hooks/useTheme";

function MessageBubble({
  message,
  isFromMe,
}: {
  message: Message;
  isFromMe: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      className={`flex-row ${
        isFromMe ? "justify-end" : "justify-start"
      }`}
    >
      <View
        style={{
          backgroundColor: isFromMe
            ? colors.primary
            : colors.backgrounds.input,
          borderColor: isFromMe ? "transparent" : colors.border,
        }}
        className={`max-w-[80%] px-3 py-2 rounded-2xl ${
          isFromMe
            ? "rounded-br-sm"
            : "rounded-bl-sm border"
        }`}
      >
        <Text
          style={{
            color: isFromMe ? "#fff" : colors.text,
          }}
          className="text-sm"
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export default MessageBubble;