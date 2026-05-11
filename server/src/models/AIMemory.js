import mongoose from 'mongoose';

const aiMemorySchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  author: {
    type: String,
    default: 'User'
  },
  type: {
    type: String,
    enum: ['decision', 'question', 'solution', 'blocker', 'summary', 'note'],
    default: 'note',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  keywords: [{
    type: String
  }],
  embedding: {
    type: [Number],
    default: undefined
  }
}, { timestamps: true });

aiMemorySchema.index({ title: 'text', content: 'text', keywords: 'text' });

export default mongoose.model('AIMemory', aiMemorySchema);
