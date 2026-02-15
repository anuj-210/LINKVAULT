import mongoose from 'mongoose';

const ShareSchema = new mongoose.Schema({
  shareId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['text', 'file'], required: true },
  content: String,
  filename: String,
  filepath: String,
  filesize: Number,
  mimetype: String,
  password: String,
  oneTime: { type: Boolean, default: false },
  maxViews: Number,
  views: { type: Number, default: 0 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  ownerOnly: { type: Boolean, default: false },
  deleteToken: { type: String, required: true, index: true },
  fileAccessToken: String,
  fileAccessTokenExpiresAt: Date,
  deleteAfterDownload: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

export const Share = mongoose.model('Share', ShareSchema);
