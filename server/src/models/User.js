import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: '' },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  providerId: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
  role: { type: String, enum: ['admin', 'member'], default: 'member' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
