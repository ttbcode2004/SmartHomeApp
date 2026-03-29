import { useRouter } from "expo-router";
import { UserCard, type UserCardUser } from "@/components/UserCard";
import { useSocialActions } from "@/hooks/useSocialActions";

export default function FollowingItem({
  user,
  colors,
  onUnfollow,
}: {
  user: UserCardUser;
  colors: any;
  onUnfollow: () => void;
}) {
  const router = useRouter();

  const {
    isFollowing,
    actionLoading,
    handleToggleFollow,
    handleFriendAction,
    getFriendBtnConfig,
  } = useSocialActions(user._id);

  const friendBtn = getFriendBtnConfig(colors);

  const handleFollow = async () => {
    const result = await handleToggleFollow();

    if (result === "unfollowed") {
      onUnfollow(); // remove khỏi list
    }
  };

  return (
    <UserCard
      user={user}
      colors={colors}
      onPress={() => router.push(`/(user)/${user._id}` as any)}
      actions={[
        {
          label: friendBtn.label,
          icon: friendBtn.icon,
          color: friendBtn.color,
          bgColor: friendBtn.bgColor,
          loading: actionLoading,
          onPress: handleFriendAction,
        },
        {
          label: isFollowing ? "Bỏ theo dõi" : "Theo dõi",
          icon: isFollowing ? "user-x" : "user-check",
          color: isFollowing ? colors.danger : colors.text,
          bgColor: isFollowing
            ? colors.danger + "15"
            : colors.surface,
          loading: actionLoading,
          onPress: handleFollow,
        },
      ]}
    />
  );
}