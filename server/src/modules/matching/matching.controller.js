const { findTwoWayMatches, findFallbackMatches } = require('./matching.queries');

async function findMatches(req, res) {
  try {
    const wantedSkillId = parseInt(req.query.wantedSkillId, 10);
    const myUserId = req.user.id;

    if (!wantedSkillId) {
      return res.status(400).json({ error: 'wantedSkillId is required' });
    }

    const twoWayResults = await findTwoWayMatches({ wantedSkillId, myUserId });
    if (twoWayResults.length > 0) {
      return res.status(200).json({ matchType: 'two-way', results: twoWayResults });
    }

    const fallbackResults = await findFallbackMatches({ wantedSkillId, myUserId });
    if (fallbackResults.length > 0) {
      return res.status(200).json({ matchType: 'fallback', results: fallbackResults });
    }

    return res.status(200).json({ matchType: 'none', results: [] });
  } catch (err) {
    console.error('Find matches error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { findMatches };