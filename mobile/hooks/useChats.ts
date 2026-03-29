import { useAuth } from "@clerk/expo";
import type { Chat } from "@/types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const useChats = () => {
  const { getToken } = useAuth();

  const {
    data: chats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const token = await getToken();

      const res = await fetch(`${API_URL}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch chats");
      }

      return json as Chat[];
    },
  });

  return {
    chats: chats ?? [],
    isLoading,
    error,
    refetch,
  };
};

export const useGetOrCreateChat = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (participantId: string) => {
      const token = await getToken();

      const res = await fetch(
        `${API_URL}/chats/with/${participantId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed");
      }

      return json as Chat;
    },

    // 🔥 update cache ngay lập tức
    onSuccess: (newChat) => {
      queryClient.setQueryData<Chat[]>(["chats"], (old) => {
        if (!old) return [newChat];

        const exists = old.some((c) => c._id === newChat._id);
        if (exists) return old;

        return [newChat, ...old];
      });
    },
  });

  return {
    getOrCreateChat: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
