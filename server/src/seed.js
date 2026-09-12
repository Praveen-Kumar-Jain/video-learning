import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { Video } from './models/Video.js';
import { Question } from './models/Question.js';
import { Assignment } from './models/Assignment.js';
import { Progress } from './models/Progress.js';
import { Response } from './models/Response.js';

await connectDatabase(env().mongoUri);
await Promise.all([Response.deleteMany({}), Progress.deleteMany({}), Assignment.deleteMany({}), Question.deleteMany({}), Video.deleteMany({}), User.deleteMany({})]);
const hash = await bcrypt.hash('Password123!', 12);
const [admin, learner] = await User.create([
  { name: 'Admin User', email: 'admin@example.com', passwordHash: hash, role: 'admin' },
  { name: 'Learner User', email: 'learner@example.com', passwordHash: hash, role: 'learner' },
]);
const video = await Video.create({ title: 'Sintel trailer - seeded demo', description: 'A public MP4 with audio used to test playback, sound, and timestamp questions.', videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4', durationSeconds: 52, isPublished: true, createdBy: admin.id });
const question = await Question.create({ videoId: video.id, timestampSeconds: 10, type: 'single', prompt: 'Which role can create videos?', options: [{ text: 'Admin' }, { text: 'Learner' }], correctOptionIds: [] });
question.correctOptionIds = [question.options[0]._id]; await question.save();
await Assignment.create({ videoId: video.id, learnerId: learner.id, assignedBy: admin.id });
console.log('Seeded admin@example.com and learner@example.com; password: Password123!');
process.exit(0);
