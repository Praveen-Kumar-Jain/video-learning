import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({ text: { type: String, required: true } }, { _id: true });
const questionSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
  timestampSeconds: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['single', 'multiple', 'short'], required: true },
  prompt: { type: String, required: true, trim: true, maxlength: 1000 },
  options: { type: [optionSchema], default: [] },
  correctOptionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  acceptedAnswers: { type: [String], default: [] },
}, { timestamps: true });

questionSchema.index({ videoId: 1, timestampSeconds: 1 }, { unique: true });
export const Question = mongoose.model('Question', questionSchema);
