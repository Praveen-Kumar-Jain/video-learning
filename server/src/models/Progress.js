import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, unique: true },
    lastWatchedSecond: { type: Number, default: 0, min: 0 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
    answeredQuestionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true },
);
export const Progress = mongoose.model('Progress', progressSchema);
