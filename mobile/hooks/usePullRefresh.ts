// usePullRefresh.ts
import { useState } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";

export default function usePullRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = useCurrentUser();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch(); // 🔥 chỉ gọi 1 API
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}