import { useRouter } from "expo-router";
import { UserCard, type UserCardUser } from "@/components/UserCard";
import { useSocialActions } from "@/hooks/useSocialActions";

export default function FriendsItem({
  user,
  colors,
  onUnfriend,
}: {
  user: UserCardUser;
  colors: any;
  onUnfriend: () => void;
}) {
  const router = useRouter();
    
  const {
    actionLoading,
    handleFriendAction, // sẽ remove friend vì đang là bạn
  } = useSocialActions(user._id);

  const handleUnfriend = async () => {
    await handleFriendAction(); // logic bên trong đã là removeFriend
    onUnfriend(); // remove khỏi UI list
  };

  return (
    <UserCard
      user={user}
      colors={colors}
      onPress={() => router.push(`/(user)/${user._id}` as any)}
      actions={[
        {
          label: "Huỷ bạn",
          icon: "user-minus",
          color: colors.danger,
          bgColor: colors.danger + "15",
          loading: actionLoading,
          onPress: handleUnfriend,
        },
      ]}
    />
  );
}