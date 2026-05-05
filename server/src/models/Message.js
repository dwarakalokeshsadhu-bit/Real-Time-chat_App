import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    default: null
  },
  dmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DirectMessage",
    default: null
  },
  senderId: {
    type: String,
    default: "User"
  },
  content: {
    type: String,
    default: ""
  },
  reactions: [
  {
    emoji: String,
    userId: mongoose.Schema.Types.ObjectId
  }
],
replyTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message",
  default: null
},
fileUrl: {
  type: String,
  default: null
},
fileType: {
  type: String,
  default: null
},
expiresAt: {
  type: Date,
  default: null
}
}, { timestamps: true });

messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Message", messageSchema);
