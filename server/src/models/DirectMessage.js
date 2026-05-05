import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessageAt: Date
}, { timestamps: true });

export default mongoose.model('DirectMessage', directMessageSchema);
