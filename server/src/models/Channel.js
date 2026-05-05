import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['public', 'private'], default: 'public' },
 
  isArchived: { type: Boolean, default: false },
  createdBy: {
  type: String,
  default: null
},
members: {
  type: [String],
  default: []
},
disappearingMessagesEnabled: {
  type: Boolean,
  default: false
},
disappearingMessageSeconds: {
  type: Number,
  default: 86400,
  min: 60
},
}, { timestamps: true });

export default mongoose.model('Channel', channelSchema);
