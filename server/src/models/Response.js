import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });
responseSchema.index({ assignmentId: 1, questionId: 1 }, { unique: true });
export const Response = mongoose.model('Response', responseSchema);
