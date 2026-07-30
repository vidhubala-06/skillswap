function shuffleOptions(question) {
  const options = [...question.options];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctText = question.options.find((o) => o.id === question.correct_option_id).text;
  const relabeled = options.map((opt, idx) => ({
    id: ['a', 'b', 'c', 'd'][idx],
    text: opt.text
  }));
  const newCorrectId = relabeled.find((o) => o.text === correctText).id;

  return {
    question: question.question,
    options: relabeled,
    correctOptionId: newCorrectId
  };
}

module.exports = { shuffleOptions };