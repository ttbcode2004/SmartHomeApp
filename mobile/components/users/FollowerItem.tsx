import { useRouter } from "expo-router";
import { UserCard, type UserCardUser } from "@/components/UserCard";
import { useSocialActions } from "@/hooks/useSocialActions";

export default function FollowerItem({
  user,
  colors,
  onRemove,
}: {
  user: UserCardUser;
  colors: any;
  onRemove: () => void;
}) {
  const router = useRouter();

  const {
    actionLoading,
    handleToggleFollow,
    handleFriendAction,
    getFriendBtnConfig,
  } = useSocialActions(user._id);

  const friendBtn = getFriendBtnConfig(colors);

  const handleRemove = async () => {
    const result = await handleToggleFollow();
    if (result === "unfollowed") {
      onRemove();
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
          label: "Xoá",
          icon: "user-x",
          color: colors.danger,
          bgColor: colors.danger + "15",
          loading: actionLoading,
          onPress: handleRemove,
        },
      ]}
    />
  );
}