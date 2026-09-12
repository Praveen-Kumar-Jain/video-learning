// Applies `{ text, isCorrect }` option inputs to a Question document, deriving
// `correctOptionIds` from the `isCorrect` flags. Mongoose assigns a fresh `_id`
// to each option subdocument as soon as `question.options` is set, so this
// works whether `question` is a brand-new or an existing document.
export function applyOptions(question, optionInputs) {
  question.options = optionInputs.map(({ text }) => ({ text }));
  question.correctOptionIds = question.options
    .filter((_, index) => optionInputs[index].isCorrect)
    .map((option) => option._id);
}
