const { v4: uuidv4 } = require('uuid');
const pool = require('../../db/pool');
const { findSkillsByIds } = require('../skills/skills.queries');
const {
  upsertProfile, insertKnownSkill, insertWantedSkill,
  removeKnownSkillsNotIn, removeWantedSkillsNotIn,
  getPendingQuizSkillIds, updateSelfRating,
  getProfile, getPublicProfile, getKnownSkillsFull, getWantedSkillsFull, getVerifiedCount
} = require('./profile.queries');
const { getPendingRequestBetween } = require('../swapRequests/swapRequests.queries');

async function loadProfile(req, res) {
  try {
    const userId = req.user.id;
    const profile = await getProfile(userId);
    const knownSkills = await getKnownSkillsFull(userId);
    const wantedSkills = await getWantedSkillsFull(userId);

    return res.status(200).json({ profile, knownSkills, wantedSkills });
  } catch (err) {
    console.error('Load profile error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function viewPublicProfile(req, res) {
  try {
    const { userId } = req.params;
    const data = await getPublicProfile(userId);
    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const pendingRequest = await getPendingRequestBetween(req.user.id, userId);

    return res.status(200).json({ ...data, pendingRequest });
  } catch (err) {
    console.error('View public profile error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function saveProfile(req, res) {
  try {
    const { name, linkedinUrl, githubUrl, experience, knownSkillIds = [], wantedSkillIds = [] } = req.body;
    const userId = req.user.id;

    // Validation BEFORE any DB write
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (knownSkillIds.length === 0 || wantedSkillIds.length === 0) {
      return res.status(400).json({ error: 'At least one known and one wanted skill are required' });
    }

    const overlap = knownSkillIds.filter((id) => wantedSkillIds.includes(id));
    if (overlap.length > 0) {
      return res.status(400).json({ error: 'A skill cannot be both known and wanted', conflictingSkillIds: overlap });
    }

    const currentKnownSkills = await getKnownSkillsFull(userId);
    const currentVerifiedIds = currentKnownSkills.filter((s) => s.status === 'verified').map((s) => s.id);
    const removedVerifiedCount = currentVerifiedIds.filter((id) => !knownSkillIds.includes(id)).length;
    const currentVerifiedCount = currentVerifiedIds.length;
    const remainingVerifiedCount = currentVerifiedCount - removedVerifiedCount;

    if (currentVerifiedCount > 0 && remainingVerifiedCount < 1) {
      return res.status(400).json({
        error: 'You must have at least one verified skill. Pass a quiz for another skill before removing this one.'
      });
    }

    const allIds = [...new Set([...knownSkillIds, ...wantedSkillIds])];
    const existingSkills = await findSkillsByIds(allIds);
    if (existingSkills.length !== allIds.length) {
      return res.status(400).json({ error: 'One or more selected skills are invalid' });
    }

    // All validation passed — now do the writes
    await upsertProfile({ userId, name: name.trim(), linkedinUrl, githubUrl, experience });

    for (const skillId of knownSkillIds) {
      await insertKnownSkill({ id: uuidv4(), userId, skillId });
    }
    await removeKnownSkillsNotIn(userId, knownSkillIds);

    for (const skillId of wantedSkillIds) {
      await insertWantedSkill({ id: uuidv4(), userId, skillId });
    }
    await removeWantedSkillsNotIn(userId, wantedSkillIds);

    const pendingQuizSkillIds = await getPendingQuizSkillIds(userId);

    return res.status(200).json({ success: true, pendingQuizSkillIds });
  } catch (err) {
    console.error('Save profile error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function saveSelfRating(req, res) {
  try {
    const { skillId, rating } = req.body;
    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }
    await updateSelfRating(req.user.id, skillId, rating);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Self rating error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { saveProfile, saveSelfRating, loadProfile, viewPublicProfile };