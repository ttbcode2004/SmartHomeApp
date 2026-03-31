
import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import type { Message } from "@/types"; 

const API_URL = process.env.EXPO_PUBLIC_API_URL;


const useMessages = (chatId?: string) => {
  const { getToken } = useAuth();

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/messages/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Message[]>;
    },
    enabled: !!chatId,
  });

  return { messages: messages ?? [], isLoading, error };
};

export default useMessages;