import { useUser } from "@clerk/expo";
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL; // e.g. "https://your-api.com/api"

export interface SyncedUser {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture: string;
  bannerImage: string;
  bio: string;
  role: string;
  followers: string[];
  following: string[];
  friends: string[];
}

interface UseUserSyncReturn {
  dbUser: SyncedUser | null;
  isSyncing: boolean;
  syncError: string | null;
  refetchUser: () => Promise<void>;
}

/**
 * Hook tự động đồng bộ Clerk user → MongoDB sau khi sign-in / sign-up.
 * Chỉ gọi API sync một lần mỗi session (dùng ref để tránh gọi lại khi re-render).
 */
const useUserSync = (): UseUserSyncReturn => {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<SyncedUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasSynced = useRef(false);

  const syncUser = async () => {
    if (!user) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const primaryEmail = user.primaryEmailAddress?.emailAddress ?? "";
      const response = await fetch(`${API_URL}/api/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          email: primaryEmail,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          profilePicture: user.imageUrl ?? "",
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message ?? "Sync failed");
      }

      setDbUser(json.data);
    } catch (err: any) {
      setSyncError(err?.message ?? "Unknown error");
      console.error("[useUserSync] Error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Chỉ sync khi Clerk đã load xong và có user, và chưa sync trong session này
    if (!isLoaded || !user || hasSynced.current) return;

    hasSynced.current = true;
    syncUser();
  }, [isLoaded, user]);

  // Reset ref khi user đăng xuất
  useEffect(() => {
    if (isLoaded && !user) {
      hasSynced.current = false;
      setDbUser(null);
      setSyncError(null);
    }
  }, [isLoaded, user]);

  return {
    dbUser,
    isSyncing,
    syncError,
    refetchUser: syncUser,
  };
};

export default useUserSync;