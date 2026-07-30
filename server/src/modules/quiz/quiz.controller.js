const { v4: uuidv4 } = require('uuid');
const { shuffleOptions } = require('../../utils/shuffle');
const {
  getKnownSkillsWithStatus,
  getKnownSkillStatus,
  getRandomQuestionsForSkill,
  createQuizSession,
  getQuizSession,
  markSessionSubmitted,
  insertQuizAttempt,
  markSkillVerified,
  markSkillCooldown
} = require('./quiz.queries');

async function getStatus(req, res) {
  try {
    const skills = await getKnownSkillsWithStatus(req.user.id);
    return res.status(200).json({ skills });
  } catch (err) {
    console.error('Quiz status error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function startQuiz(req, res) {
  try {
    const { skillId } = req.body;
    const userId = req.user.id;

    const knownSkill = await getKnownSkillStatus(userId, skillId);
    if (!knownSkill) {
      return res.status(400).json({ error: 'This skill is not in your known skills list' });
    }
    if (knownSkill.status === 'verified') {
      return res.status(400).json({ error: 'This skill is already verified' });
    }
    if (knownSkill.status === 'cooldown' && new Date(knownSkill.cooldown_until) > new Date()) {
      return res.status(400).json({ error: 'This skill is still in cooldown', cooldownUntil: knownSkill.cooldown_until });
    }

    const rawQuestions = await getRandomQuestionsForSkill(skillId, 25);
    if (rawQuestions.length < 25) {
      return res.status(400).json({ error: 'Not enough questions available for this skill yet' });
    }

    // options are stored as JSON strings — parse, then shuffle each question
    const shuffledQuestions = rawQuestions.map((q) => {
      const parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      return shuffleOptions({
        question: q.question,
        options: parsedOptions,
        correct_option_id: q.correct_option_id
      });
    });

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    await createQuizSession({
      id: sessionId,
      userId,
      skillId,
      questionsJson: { questions: shuffledQuestions },
      expiresAt
    });

    // Strip correct answers before sending to frontend
    const strippedQuestions = shuffledQuestions.map((q) => ({
      question: q.question,
      options: q.options
    }));

    return res.status(200).json({ sessionId, questions: strippedQuestions, expiresAt });
  } catch (err) {
    console.error('Start quiz error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function submitQuiz(req, res) {
  try {
    const { sessionId, answers } = req.body;
    const userId = req.user.id;

    const session = await getQuizSession(sessionId, userId);
    if (!session) {
      return res.status(404).json({ error: 'Quiz session not found' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'This quiz has already been submitted' });
    }
    if (new Date(session.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This quiz session has expired' });
    }

    const questionsData = typeof session.questions_json === 'string'
      ? JSON.parse(session.questions_json)
      : session.questions_json;

    let score = 0;
    questionsData.questions.forEach((q, i) => {
      const userAnswer = answers.find((a) => a.questionIndex === i);
      if (userAnswer && userAnswer.selectedOptionId === q.correctOptionId) {
        score += 2;
      }
    });

    const totalMarks = 50;
    const passed = score >= 48;

    await markSessionSubmitted(sessionId);
    await insertQuizAttempt({
      id: uuidv4(),
      userId,
      skillId: session.skill_id,
      score,
      totalMarks,
      passed
    });

    if (passed) {
      await markSkillVerified({ userId, skillId: session.skill_id, score });
    } else {
      await markSkillCooldown({ userId, skillId: session.skill_id });
    }

    return res.status(200).json({
      score,
      totalMarks,
      passed,
      skillId: session.skill_id
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { getStatus, startQuiz, submitQuiz };