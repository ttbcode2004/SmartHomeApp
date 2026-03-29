import { Server as SocketServer } from "socket.io";
import { verifyToken } from "@clerk/express";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

// store online users
export const onlineUsers = new Map();

export const initializeSocket = (httpServer) => {
  // const allowedOrigins = [
  //   "http://localhost:8081",
  //   "http://localhost:5173",
  // ];

  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const clerkId = session.sub;

      const user = await User.findOne({ clerkId });
      if (!user) return next(new Error("User not found"));

      socket.data.userId = user._id.toString();

      next();
    } catch (error) {
      next(new Error("Auth failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.emit("online-users", {
      userIds: Array.from(onlineUsers.keys()),
    });

    onlineUsers.set(userId, socket.id);

    socket.broadcast.emit("user-online", { userId });

    socket.join(`user:${userId}`);

    socket.on("join-chat", (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("send-message", async (data) => {
      try {
        const { chatId, text } = data;

        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId,
        });

        if (!chat) {
          socket.emit("socket-error", { message: "Chat not found" });
          return;
        }

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          text,
        });

        chat.lastMessage = message._id;
        chat.lastMessageAt = new Date();
        await chat.save();

        await message.populate("sender", "name avatar");

        io.to(`chat:${chatId}`).emit("new-message", message);

        for (const participantId of chat.participants) {
          io.to(`user:${participantId}`).emit("new-message", message);
        }
      } catch (error) {
        socket.emit("socket-error", {
          message: "Failed to send message",
        });
      }
    });

    socket.on("typing", async (data) => {
      const typingPayload = {
        userId,
        chatId: data.chatId,
        isTyping: data.isTyping,
      };

      socket.to(`chat:${data.chatId}`).emit("typing", typingPayload);

      try {
        const chat = await Chat.findById(data.chatId);
        if (chat) {
          const otherParticipantId = chat.participants.find(
            (p) => p.toString() !== userId
          );

          if (otherParticipantId) {
            socket
              .to(`user:${otherParticipantId}`)
              .emit("typing", typingPayload);
          }
        }
      } catch (error) {}
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user-offline", { userId });
    });
  });

  return io;
};