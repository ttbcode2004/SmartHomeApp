import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

import useTheme from "@/hooks/useTheme";
import useNotifications, { NotificationItem as NotificationItemType } from "@/hooks/useNotifications";
import NotificationItem from "@/components/notifications/NotificationItem";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications, unreadCount, isLoading, isLoadingMore,
    hasMore, fetchNotifications, loadMore,
    markAsRead, markAllAsRead, deleteNotification, deleteAll,
  } = useNotifications();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(true);
    setRefreshing(false);
  }, [fetchNotifications]);

  const renderItem = useCallback(({ item }: { item: NotificationItemType }) => (
    <NotificationItem
      item={item}
      colors={colors}
      onPress={() => !item.isRead && markAsRead(item._id)}
      onDelete={() => deleteNotification(item._id)}
    />
  ), [colors, markAsRead, deleteNotification]);

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center gap-2">
          <Text
            className="text-2xl font-bold tracking-tight"
            style={{ color: colors.text }}
          >
            Thông báo
          </Text>
          {unreadCount > 0 && (
            <View
              className="rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: colors.danger }}
            >
              <Text className="text-white text-xs font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <View className="flex-row gap-3">
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead}>
                <Feather name="check-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={deleteAll}>
              <Feather name="trash-2" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => hasMore && loadMore()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                className="my-4"
              />
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24 gap-3">
              <Feather name="bell-off" size={52} color={colors.border} />
              <Text className="text-base" style={{ color: colors.textMuted }}>
                Không có thông báo
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}