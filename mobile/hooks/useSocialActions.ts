import { useState, useCallback } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";

export interface FriendBtnConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  disabled: boolean;
}

export const useSocialActions = (targetId: string) => {
  const {
    dbUser,
    toggleFollow,
    sendFriendRequest,
    removeFriend,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    isFriend,
    isFollowing,
    isFriendRequestSent,
  } = useCurrentUser();

  const [actionLoading, setActionLoading] = useState(false);

  const friend      = isFriend(targetId);
  const following   = isFollowing(targetId);
  const requestSent = isFriendRequestSent(targetId);

  /* ── Follow ── */
  const handleToggleFollow = useCallback(async () => {
    setActionLoading(true);
    try {
      return await toggleFollow(targetId);
    } finally {
      setActionLoading(false);
    }
  }, [targetId, toggleFollow]);

  /* ── Friend actions ── */
  const handleFriendAction = useCallback(async () => {
    setActionLoading(true);
    try {
      if (isFriend(targetId)) {
        await removeFriend(targetId);
      } else if (isFriendRequestSent(targetId)) {
        await cancelFriendRequest(targetId);
      } else {
        await sendFriendRequest(targetId);
      }
    } finally {
      setActionLoading(false);
    }
  }, [targetId, removeFriend, sendFriendRequest, cancelFriendRequest, isFriend, isFriendRequestSent]);

  const handleAcceptFriend = useCallback(async () => {
    setActionLoading(true);
    try {      
      return await acceptFriendRequest(targetId);
    } finally {
      setActionLoading(false);
    }
  }, [targetId, acceptFriendRequest]);

  const handleRejectFriend = useCallback(async () => {
    setActionLoading(true);
    try {
      return await rejectFriendRequest(targetId);
    } finally {
      setActionLoading(false);
    }
  }, [targetId, rejectFriendRequest]);

  /* ── Button config ── */
  const getFriendBtnConfig = useCallback((colors: any): FriendBtnConfig => {
    if (isFriend(targetId)) return {
      label: "Huỷ kết bạn", icon: "user-minus",
      color: colors.danger,  bgColor: colors.danger + "15", disabled: false,
    };
    if (isFriendRequestSent(targetId)) return {
      label: "Huỷ lời mời", icon: "x-circle",
      color: colors.warning ?? colors.textMuted,
      bgColor: (colors.warning ?? colors.textMuted) + "15", disabled: false,
    };
    return {
      label: "Kết bạn",    icon: "user-plus",
      color: colors.primary, bgColor: colors.primary + "15", disabled: false,
    };
  }, [targetId, isFriend, isFriendRequestSent]);

  return {
    isFollowing:         following,
    isFriend:            friend,
    isFriendRequestSent: requestSent,
    actionLoading,
    handleToggleFollow,
    handleFriendAction,
    handleAcceptFriend,
    handleRejectFriend,
    getFriendBtnConfig,
  };
};