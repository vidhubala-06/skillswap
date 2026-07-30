const { v4: uuidv4 } = require('uuid');
const model = require('../../config/gemini');
const { insertQuizQuestion } = require('./quiz.queries');

function buildPrompt(skillName) {
  return `Generate 30 multiple-choice questions to test practical knowledge of "${skillName}".
Each question has exactly 4 options.
Return ONLY valid JSON, no other text, no markdown code fences:
{
  "questions": [
    {
      "question": "...",
      "options": [
        {"id": "a", "text": "..."},
        {"id": "b", "text": "..."},
        {"id": "c", "text": "..."},
        {"id": "d", "text": "..."}
      ],
      "correctOptionId": "a"
    }
  ]
}
Questions should test genuine practical/conceptual understanding, avoid ambiguous or trick questions, and have exactly one unambiguously correct option.`;
}

function parseGeminiResponse(rawText) {
  // Strip markdown code fences if Gemini wraps the JSON despite instructions
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

function validateShape(parsed) {
  if (!parsed.questions || !Array.isArray(parsed.questions)) return false;
  if (parsed.questions.length !== 30) return false;

  for (const q of parsed.questions) {
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) return false;
    const optionIds = q.options.map((o) => o.id);
    if (!optionIds.includes(q.correctOptionId)) return false;
  }
  return true;
}

async function generateQuestionBankForSkill(skillId, skillName) {
  const prompt = buildPrompt(skillName);

  let parsed;
  let attempts = 0;
  const maxAttempts = 4;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      parsed = parseGeminiResponse(rawText);

      if (validateShape(parsed)) break;
      console.warn(`Attempt ${attempts}: invalid shape — got ${parsed?.questions?.length ?? 'unknown'} questions, retrying...`);
      parsed = null;
    } catch (err) {
      console.warn(`Attempt ${attempts}: generation/parse failed`, err.message);
      parsed = null;
    }

    if (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }

  if (!parsed) {
    throw new Error('Failed to generate a valid question set after retries');
  }

  for (const q of parsed.questions) {
    await insertQuizQuestion({
      id: uuidv4(),
      skillId,
      question: q.question,
      options: q.options,
      correctOptionId: q.correctOptionId
    });
  }

  return parsed.questions.length;
}

module.exports = { generateQuestionBankForSkill };