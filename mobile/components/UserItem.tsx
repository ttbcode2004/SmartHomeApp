import type { PublicUser } from "@/types";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import useTheme from "@/hooks/useTheme";

type UserItemProps = {
  user: PublicUser;
  isOnline: boolean;
  onPress: () => void;
};

function UserItem({ user, isOnline, onPress }: UserItemProps) {
  const { colors } = useTheme();

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "Unknown";

  return (
    <Pressable
      className="flex-row items-center py-2.5 active:opacity-70"
      onPress={onPress}
    >
      {/* Avatar */}
      <View className="relative">
        <Image
          source={{
            uri:
              user.profilePicture ||
              "https://ui-avatars.com/api/?name=User&background=444",
          }}
          style={{ width: 48, height: 48, borderRadius: 999 }}
        />

        {isOnline && (
          <View
            style={{
              backgroundColor: colors.success,
              borderColor: colors.surface,
            }}
            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2px]"
          />
        )}
      </View>

      {/* Info */}
      <View
        style={{ borderBottomColor: colors.border }}
        className="flex-1 ml-3 border-b pb-2"
      >
        <View className="flex-row items-center justify-between">
          <Text
            style={{ color: colors.text }}
            className="font-medium"
            numberOfLines={1}
          >
            {fullName}
          </Text>

          {isOnline && (
            <Text
              style={{ color: colors.success }}
              className="text-xs font-medium"
            >
              Online
            </Text>
          )}
        </View>

        <Text
          style={{ color: colors.textMuted }}
          className="text-xs mt-0.5"
          numberOfLines={1}
        >
          {user.bio || "No bio yet"}
        </Text>
      </View>
    </Pressable>
  );
}

export default UserItem;