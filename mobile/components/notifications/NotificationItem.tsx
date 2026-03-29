import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { NotificationItem as NotificationItemType } from "@/hooks/useNotifications";
import { useSocialActions } from "@/hooks/useSocialActions";

const TYPE_META: Record<string, { icon: string; label: string }> = {
  follow:         { icon: "user-plus",      label: "đã theo dõi bạn" },
  friend_request: { icon: "users",          label: "gửi lời mời kết bạn" },
  friend_accept:  { icon: "heart",          label: "đã chấp nhận kết bạn" },
  like:           { icon: "heart",          label: "đã thích bài viết của bạn" },
  comment:        { icon: "message-circle", label: "đã bình luận" },
  order:          { icon: "shopping-bag",   label: "cập nhật đơn hàng" },
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

interface Props {
  item: NotificationItemType;
  colors: any;
  onPress: () => void;
  onDelete: () => void;
}

/* ── Friend request buttons ── */
function FriendRequestActions({
  fromId, colors,
}: {
  fromId: string;
  colors: any;
}) {
  const { handleAcceptFriend, handleRejectFriend, actionLoading, isFriend } =
    useSocialActions(fromId);

  // Đã là bạn bè → ẩn button
  if (isFriend) {
    return (
      <View className="flex-row items-center gap-1 mt-1">
        <Feather name="check-circle" size={13} color={colors.success} />
        <Text className="text-xs font-semibold" style={{ color: colors.success }}>
          Đã là bạn bè
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row gap-2 mt-2">
      {/* Chấp nhận */}
      <TouchableOpacity
        onPress={handleAcceptFriend}
        disabled={actionLoading}
        className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
        style={{ backgroundColor: colors.primary, opacity: actionLoading ? 0.7 : 1 }}
      >
        {actionLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Feather name="check" size={12} color="#fff" />
            <Text className="text-xs font-semibold text-white">Chấp nhận</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Từ chối */}
      <TouchableOpacity
        onPress={handleRejectFriend}
        disabled={actionLoading}
        className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: actionLoading ? 0.7 : 1,
        }}
      >
        <Feather name="x" size={12} color={colors.text} />
        <Text className="text-xs font-semibold" style={{ color: colors.text }}>Từ chối</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Main component ── */
export default function NotificationItem({ item, colors, onPress, onDelete }: Props) {

  const meta = TYPE_META[item.type] ?? { icon: "bell", label: "" };
  const name = item.from
    ? `${item.from.firstName} ${item.from.lastName}`.trim() || item.from.username
    : "Hệ thống";

  const isFriendRequest = item.type === "friend_request" && !!item.from?._id;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="px-4 py-3"
      style={{
        backgroundColor: item.isRead ? colors.bg : colors.primary + "10",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View className="flex-row items-start gap-3">
        {/* Avatar */}
        <View className="relative">
          {item.from?.profilePicture ? (
            <Image
              source={{ uri: item.from.profilePicture }}
              className="w-12 h-12 rounded-full"
              style={{ backgroundColor: colors.border }}
            />
          ) : (
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + "20" }}
            >
              <Feather name={meta.icon as any} size={20} color={colors.primary} />
            </View>
          )}
          <View
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary, borderWidth: 1.5, borderColor: colors.bg }}
          >
            <Feather name={meta.icon as any} size={9} color="#fff" />
          </View>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-sm leading-5" style={{ color: colors.text }} numberOfLines={2}>
            <Text className="font-bold">{name}</Text>
            {" "}{meta.label}
            {item.product ? (
              <Text style={{ color: colors.textMuted }}> · {item.product.name}</Text>
            ) : null}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
            {timeAgo(item.createdAt)}
          </Text>

          {/* ── Friend request buttons ── */}
          {isFriendRequest && (
            <FriendRequestActions fromId={item.from!._id} colors={colors} />
          )}
        </View>

        {/* Unread dot + delete */}
        <View className="items-center gap-2">
          {!item.isRead && (
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }} />
          )}
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
