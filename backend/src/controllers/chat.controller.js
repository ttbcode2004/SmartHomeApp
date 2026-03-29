import  Chat  from "../models/chat.model.js";

export async function getChats(req, res, next) {
  try {
    const userId = req.userId;

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "username firstName lastName email profilePicture")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find((p) => p._id.toString() !== userId);

      return {
        _id: chat._id,
        participant: otherParticipant ?? null,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
      };
    });

    res.json(formattedChats);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function getOrCreateChat(req, res, next) {
  try {
    const userId = req.userId;
    const { participantId } = req.params;

    if (!participantId) {
      res.status(400).json({ message: "Participant ID is required" });
      return;
    }

    if (userId === participantId) {
      res.status(400).json({ message: "Cannot create chat with yourself" });
      return;
    }

    // check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] },
    })
      .populate("participants", "username firstName lastName email profilePicture")
      .populate("lastMessage");

    if (!chat) {
      const newChat = new Chat({ participants: [userId, participantId] });
      await newChat.save();
      chat = await newChat.populate("participants", "username firstName lastName email profilePicture");
    }

    const otherParticipant = chat.participants.find((p) => p._id.toString() !== userId);

    res.json({
      _id: chat._id,
      participant: otherParticipant ?? null,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
