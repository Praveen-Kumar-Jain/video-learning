import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 3000 },
    thumbnailUrl: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    durationSeconds: { type: Number, required: true, min: 1 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Video = mongoose.model('Video', videoSchema);
