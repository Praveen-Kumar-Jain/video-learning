import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);
assignmentSchema.index({ videoId: 1, learnerId: 1 }, { unique: true });
export const Assignment = mongoose.model('Assignment', assignmentSchema);
