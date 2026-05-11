import mongoose from 'mongoose';

const aiTaskSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  assignee: {
    type: String,
    default: ''
  },
  dueText: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    default: null
  },
  sourceText: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'done'],
    default: 'open',
    index: true
  },
  confidence: {
    type: Number,
    default: 0.7
  }
}, { timestamps: true });

export default mongoose.model('AITask', aiTaskSchema);
