import { View, Text, Image, TouchableOpacity } from "react-native";
import Feather from "@expo/vector-icons/Feather";

export type UserCardUser = {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
};

type Action = {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  onPress: () => void;
  loading?: boolean;
};

export const UserCard = ({
  user,
  actions = [],
  onPress,
  colors,
}: {
  user: UserCardUser;
  actions?: Action[];
  onPress: () => void;
  colors: any;
}) => {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.username;
  
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      {/* Avatar */}
      {user.profilePicture ? (
        <Image
          source={{ uri: user.profilePicture }}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.border }}
        />
      ) : (
        <View
          style={{
            width: 46, height: 46, borderRadius: 23,
            backgroundColor: colors.primary + "20",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Feather name="user" size={20} color={colors.primary} />
        </View>
      )}

      {/* Name */}
      <View className="flex-1">
        <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
          {fullName}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
          @{user.username}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            onPress={(e) => { e.stopPropagation(); action.onPress(); }}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: action.bgColor }}
          >
            <Feather name={action.icon as any} size={12} color={action.color} />
            <Text className="text-xs font-medium" style={{ color: action.color }}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
};