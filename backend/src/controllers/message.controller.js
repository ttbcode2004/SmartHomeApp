
import  Message  from "../models/message.model.js";
import  Chat  from "../models/chat.model.js";

export async function getMessages(req, res, next) {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "firstName lastName profilePicture email")
      .sort({ createdAt: 1 }); // oldest first

    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
}