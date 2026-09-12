import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { Video } from './models/Video.js';
import { Question } from './models/Question.js';
import { Assignment } from './models/Assignment.js';
import { Progress } from './models/Progress.js';
import { Response } from './models/Response.js';
import { applyOptions } from './utils/questionOptions.js';

const PASSWORD = 'Password123!';

// Each option carries `isCorrect` here only to drive `correctOptionIds`
// derivation below; the persisted Question.options schema is just `{ text }`.
const courseDefinitions = [
  {
    slug: 'leadership-fundamentals',
    title: 'Leadership Fundamentals: Leading with Empathy',
    description: 'A management-track lesson on empathetic leadership and its impact on team retention.',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    durationSeconds: 52,
    isPublished: true,
    questions: [
      {
        timestampSeconds: 8,
        type: 'single',
        prompt: 'What is the first step in demonstrating empathetic leadership?',
        options: [
          { text: 'Active listening', isCorrect: true },
          { text: 'Assigning blame' },
          { text: 'Ignoring feedback' },
          { text: 'Multitasking during conversations' },
        ],
      },
      {
        timestampSeconds: 20,
        type: 'multiple',
        prompt: 'Which of the following are traits of an empathetic leader? (Select all that apply)',
        options: [
          { text: 'Active listening', isCorrect: true },
          { text: 'Self-awareness', isCorrect: true },
          { text: 'Compassion', isCorrect: true },
          { text: 'Micromanaging' },
          { text: 'Dismissing concerns' },
        ],
      },
      {
        timestampSeconds: 35,
        type: 'short',
        prompt: "Name one benefit of empathetic leadership for a team's retention.",
        acceptedAnswers: [
          'higher retention',
          'reduced turnover',
          'improved retention',
          'better retention',
          'increased retention',
          'lower turnover',
        ],
      },
      {
        timestampSeconds: 48,
        type: 'single',
        prompt: 'True or false: empathy means always agreeing with your team.',
        options: [{ text: 'True' }, { text: 'False', isCorrect: true }],
      },
    ],
  },
  {
    slug: 'data-privacy-basics',
    title: 'Data Privacy & Security Basics',
    description: 'Core practices every employee should follow to protect customer and company data.',
    videoUrl: 'https://samplelib.com/mp4/sample-30s.mp4',
    durationSeconds: 30,
    isPublished: true,
    questions: [
      {
        timestampSeconds: 5,
        type: 'single',
        prompt: 'Which of these is considered personally identifiable information (PII)?',
        options: [
          { text: 'Favorite color' },
          { text: 'Social Security number', isCorrect: true },
          { text: 'Weather forecast' },
          { text: 'Public holiday schedule' },
        ],
      },
      {
        timestampSeconds: 12,
        type: 'multiple',
        prompt: 'Which practices help protect customer data? (Select all that apply)',
        options: [
          { text: 'Strong password policies', isCorrect: true },
          { text: 'Encryption at rest', isCorrect: true },
          { text: 'Two-factor authentication', isCorrect: true },
          { text: 'Sharing passwords over email' },
        ],
      },
      {
        timestampSeconds: 20,
        type: 'short',
        prompt: 'What does the acronym GDPR stand for? (just the first word is fine)',
        acceptedAnswers: ['general', 'general data protection regulation'],
      },
      {
        timestampSeconds: 27,
        type: 'single',
        prompt: 'Who should you notify first after discovering a data breach?',
        options: [
          { text: 'Security/compliance team', isCorrect: true },
          { text: 'Social media' },
          { text: 'Competitors' },
          { text: 'No one' },
        ],
      },
    ],
  },
  {
    slug: 'effective-email',
    title: 'Effective Email Communication',
    description: 'Writing clear, professional emails that get read and get results.',
    videoUrl: 'https://samplelib.com/mp4/sample-15s.mp4',
    durationSeconds: 15,
    isPublished: true,
    questions: [
      {
        timestampSeconds: 3,
        type: 'single',
        prompt: 'What should a professional email subject line be?',
        options: [
          { text: 'Vague' },
          { text: 'Clear and specific', isCorrect: true },
          { text: 'Written in all caps' },
          { text: 'Left blank' },
        ],
      },
      {
        timestampSeconds: 7,
        type: 'multiple',
        prompt: 'Which of these improve email clarity? (Select all that apply)',
        options: [
          { text: 'Bullet points', isCorrect: true },
          { text: 'Short paragraphs', isCorrect: true },
          { text: 'One clear call-to-action', isCorrect: true },
          { text: 'A wall of unbroken text' },
        ],
      },
      {
        timestampSeconds: 11,
        type: 'short',
        prompt: 'What is a polite word to start a follow-up email?',
        acceptedAnswers: ['hi', 'hello', 'dear', 'greetings'],
      },
    ],
  },
  {
    slug: 'workplace-safety',
    title: 'Workplace Safety Essentials',
    description: 'Recognizing hazards and responding correctly to keep yourself and coworkers safe.',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    durationSeconds: 10,
    isPublished: true,
    questions: [
      {
        timestampSeconds: 2,
        type: 'single',
        prompt: 'What is the first thing to do when you notice a safety hazard?',
        options: [
          { text: 'Ignore it' },
          { text: 'Report it immediately', isCorrect: true },
          { text: 'Wait for someone else to notice' },
          { text: 'Take a photo and move on' },
        ],
      },
      {
        timestampSeconds: 5,
        type: 'single',
        prompt: 'Which color typically indicates an emergency exit sign?',
        options: [{ text: 'Blue' }, { text: 'Green', isCorrect: true }, { text: 'Purple' }, { text: 'Black' }],
      },
      {
        timestampSeconds: 8,
        type: 'short',
        prompt: 'What number do you call in a workplace emergency in the US?',
        acceptedAnswers: ['911', '9-1-1'],
      },
    ],
  },
  {
    slug: 'customer-service-first-impressions',
    title: 'Customer Service First Impressions',
    description: 'How to greet, listen to, and build trust with customers from the first interaction.',
    videoUrl: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
    durationSeconds: 10,
    isPublished: true,
    questions: [
      {
        timestampSeconds: 2,
        type: 'single',
        prompt: "What's the best way to greet a customer?",
        options: [
          { text: 'Ignore them' },
          { text: 'With a warm, prompt greeting', isCorrect: true },
          { text: 'Wait for them to speak first' },
          { text: 'Look at your phone' },
        ],
      },
      {
        timestampSeconds: 5,
        type: 'multiple',
        prompt: 'Which of these build customer trust? (Select all that apply)',
        options: [
          { text: 'Active listening', isCorrect: true },
          { text: 'Following up', isCorrect: true },
          { text: 'Honesty', isCorrect: true },
          { text: 'Empty promises' },
        ],
      },
      {
        timestampSeconds: 8,
        type: 'short',
        prompt: 'What tone of voice is recommended when helping an unhappy customer?',
        acceptedAnswers: ['calm', 'calm and empathetic', 'empathetic', 'friendly'],
      },
    ],
  },
  {
    slug: 'standup-etiquette',
    title: 'Daily Stand-up Etiquette',
    description: 'Keeping daily stand-ups short, focused, and useful for the whole team.',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    durationSeconds: 5,
    isPublished: false,
    questions: [
      {
        timestampSeconds: 1,
        type: 'single',
        prompt: 'How long should a daily stand-up typically last?',
        options: [
          { text: '15 minutes or less', isCorrect: true },
          { text: '2 hours' },
          { text: 'All day' },
          { text: '5 seconds' },
        ],
      },
      {
        timestampSeconds: 3,
        type: 'short',
        prompt: 'Name one thing you should mention in a stand-up update.',
        acceptedAnswers: ['blockers', 'progress', 'what you did yesterday', 'plans for today', "yesterday's work"],
      },
    ],
  },
];

const learnerDefinitions = [
  { name: 'Alex Morgan', email: 'learner@example.com' },
  { name: 'Mia Chen', email: 'mia.chen@example.com' },
  { name: 'Daniel Osei', email: 'daniel.osei@example.com' },
  { name: 'Sofia Garcia', email: 'sofia.garcia@example.com' },
  { name: "Liam O'Connor", email: 'liam.oconnor@example.com' },
  { name: 'Aisha Khan', email: 'aisha.khan@example.com' },
  { name: 'Noah Kim', email: 'noah.kim@example.com' },
  { name: 'Emma Rossi', email: 'emma.rossi@example.com' },
];

function buildQuestion(videoId, definition) {
  const question = new Question({
    videoId,
    timestampSeconds: definition.timestampSeconds,
    type: definition.type,
    prompt: definition.prompt,
    acceptedAnswers: definition.acceptedAnswers || [],
  });
  applyOptions(question, definition.options || []);
  return question;
}

// Picks a plausible answer for a question: the correct one, or the first
// incorrect option/an obviously wrong short answer otherwise.
function answerFor(question, correct) {
  if (question.type === 'short') {
    return correct ? question.acceptedAnswers[0] : 'not sure';
  }
  const pool = correct
    ? question.correctOptionIds
    : question.options
        .map((o) => o._id)
        .filter((id) => !question.correctOptionIds.some((c) => String(c) === String(id)));
  const ids = pool.length ? pool : [question.options[0]._id];
  return question.type === 'multiple' ? ids.map(String) : String(ids[0]);
}

async function recordProgress({ assignment, questions, answeredCount, allCorrect, completed }) {
  const answered = questions.slice(0, answeredCount);
  await Promise.all(
    answered.map((question, index) =>
      Response.create({
        assignmentId: assignment.id,
        questionId: question.id,
        answer: answerFor(question, allCorrect || index % 3 !== 0),
      }),
    ),
  );
  const lastQuestionSecond = answered.length ? answered[answered.length - 1].timestampSeconds : 0;
  const duration = assignment.durationSeconds;
  const lastWatchedSecond = completed ? duration : Math.min(duration - 1, lastQuestionSecond + 2);
  await Progress.create({
    assignmentId: assignment.id,
    lastWatchedSecond,
    completionPercentage: completed ? 100 : Math.round((lastWatchedSecond / duration) * 100),
    status: completed ? 'completed' : answered.length ? 'in_progress' : 'not_started',
    answeredQuestionIds: answered.map((question) => question.id),
  });
}

await connectDatabase(env().mongoUri);
await Promise.all([
  Response.deleteMany({}),
  Progress.deleteMany({}),
  Assignment.deleteMany({}),
  Question.deleteMany({}),
  Video.deleteMany({}),
  User.deleteMany({}),
]);

const passwordHash = await bcrypt.hash(PASSWORD, 12);
const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', passwordHash, role: 'admin' });
const learners = await User.create(
  learnerDefinitions.map((learner) => ({ ...learner, passwordHash, role: 'learner' })),
);
const learnerByEmail = new Map(learners.map((learner) => [learner.email, learner]));

const courses = new Map();
for (const definition of courseDefinitions) {
  const video = await Video.create({
    title: definition.title,
    description: definition.description,
    thumbnailUrl: `https://picsum.photos/seed/${definition.slug}/640/360`,
    videoUrl: definition.videoUrl,
    durationSeconds: definition.durationSeconds,
    isPublished: definition.isPublished,
    createdBy: admin.id,
  });
  const questions = [];
  for (const questionDefinition of definition.questions) {
    const question = buildQuestion(video.id, questionDefinition);
    await question.save();
    questions.push(question);
  }
  courses.set(definition.slug, { video, questions, durationSeconds: definition.durationSeconds });
}

async function assign(email, slug, outcome) {
  const learner = learnerByEmail.get(email);
  const course = courses.get(slug);
  const assignmentDoc = await Assignment.create({
    videoId: course.video.id,
    learnerId: learner.id,
    assignedBy: admin.id,
  });
  const assignment = { id: assignmentDoc.id, durationSeconds: course.durationSeconds };
  if (outcome === 'not_started') return;
  if (outcome === 'completed_correct') {
    await recordProgress({
      assignment,
      questions: course.questions,
      answeredCount: course.questions.length,
      allCorrect: true,
      completed: true,
    });
  } else if (outcome === 'completed_mixed') {
    await recordProgress({
      assignment,
      questions: course.questions,
      answeredCount: course.questions.length,
      allCorrect: false,
      completed: true,
    });
  } else if (outcome === 'in_progress') {
    await recordProgress({
      assignment,
      questions: course.questions,
      answeredCount: Math.max(1, Math.ceil(course.questions.length / 2)),
      allCorrect: false,
      completed: false,
    });
  }
}

await assign('learner@example.com', 'leadership-fundamentals', 'in_progress');
await assign('learner@example.com', 'data-privacy-basics', 'completed_correct');
await assign('learner@example.com', 'workplace-safety', 'not_started');

await assign('mia.chen@example.com', 'leadership-fundamentals', 'completed_correct');
await assign('daniel.osei@example.com', 'leadership-fundamentals', 'completed_mixed');
await assign('daniel.osei@example.com', 'effective-email', 'completed_correct');
await assign('sofia.garcia@example.com', 'data-privacy-basics', 'in_progress');
await assign('liam.oconnor@example.com', 'effective-email', 'not_started');
await assign('aisha.khan@example.com', 'workplace-safety', 'completed_correct');
await assign('aisha.khan@example.com', 'customer-service-first-impressions', 'in_progress');
await assign('noah.kim@example.com', 'customer-service-first-impressions', 'completed_mixed');
// emma.rossi@example.com is intentionally left with no assignments (empty-state demo).

console.log('Seeded 1 admin, 8 learners, and 6 courses (one unpublished).');
console.log(`Sign in with any account and password: ${PASSWORD}`);
console.log('Admin: admin@example.com');
console.log('Learner (rich demo data): learner@example.com');
process.exit(0);
