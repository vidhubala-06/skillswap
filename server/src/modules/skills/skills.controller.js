const { v4: uuidv4 } = require('uuid');
const { normalize } = require('../../utils/normalize');
const {
  searchSkills,
  findSkillByNormalizedName,
  findPendingSuggestion,
  incrementSuggestionCount,
  createSuggestion,
  getAllSkillsList
} = require('./skills.queries');

async function search(req, res) {
  try {
    const query = req.query.q || '';
    if (query.length < 1) {
      return res.status(200).json({ skills: [] });
    }
    const skills = await searchSkills(query);
    return res.status(200).json({ skills });
  } catch (err) {
    console.error('Skill search error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function suggest(req, res) {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Skill name must be at least 2 characters' });
    }

    const normalizedName = normalize(name);

    // Check if it already exists as a real skill
    const existing = await findSkillByNormalizedName(normalizedName);
    if (existing) {
      return res.status(200).json({ existingMatch: true, skill: existing });
    }

    // Check if already pending as a suggestion
    const pending = await findPendingSuggestion(normalizedName);
    if (pending) {
      await incrementSuggestionCount(pending.id);
      return res.status(200).json({
        success: true,
        message: 'Submitted for review. You\'ll be able to select it once added.'
      });
    }

    await createSuggestion({
      id: uuidv4(),
      suggestedName: name.trim(),
      normalizedName,
      submittedBy: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Submitted for review. You\'ll be able to select it once added.'
    });
  } catch (err) {
    console.error('Skill suggestion error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listAll(req, res) {
  try {
    const skills = await getAllSkillsList();
    return res.status(200).json({ skills });
  } catch (err) {
    console.error('List all skills error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { search, suggest, listAll };