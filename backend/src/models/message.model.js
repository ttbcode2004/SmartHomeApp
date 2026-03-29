import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// indexes for faster queries
MessageSchema.index({ chat: 1, createdAt: 1 }); // oldest one first
// 1 - asc
// -1 -> desc

const Message = mongoose.model("Message", MessageSchema);
export default Message