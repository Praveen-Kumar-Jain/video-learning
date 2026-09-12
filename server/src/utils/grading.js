function normalize(value) {
  return String(value).trim().toLowerCase();
}

export function gradeResponse(question, answer) {
  if (question.type === 'short') {
    if (typeof answer !== 'string') return false;
    const submitted = normalize(answer);
    return question.acceptedAnswers.some((accepted) => normalize(accepted) === submitted);
  }

  const submittedIds = (Array.isArray(answer) ? answer : [answer]).map(String).sort();
  const correctIds = question.correctOptionIds.map(String).sort();
  if (submittedIds.length !== correctIds.length) return false;
  return submittedIds.every((id, index) => id === correctIds[index]);
}
