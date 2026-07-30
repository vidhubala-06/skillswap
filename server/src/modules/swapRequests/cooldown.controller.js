const pool = require('../../db/pool');
const { upsertCooldown, getTeachingCooldowns, updateTeachingCooldown } = require('./cooldown.queries');

async function setCooldown(req, res) {
  try {
    const { swapId, cooldownDays } = req.body;
    const userId = req.user.id;

    if (cooldownDays !== null && (cooldownDays < 0 || cooldownDays > 365)) {
      return res.status(400).json({ error: 'Cooldown must be between 0 and 365 days' });
    }

    const [rows] = await pool.query(
      `SELECT requester_id AS requesterId, recipient_id AS recipientId,
              offered_skill_id AS offeredSkillId, wanted_skill_id AS wantedSkillId
       FROM swap_requests WHERE id = ? AND status = 'completed'`,
      [swapId]
    );
    const swap = rows[0];
    if (!swap) {
      return res.status(404).json({ error: 'Completed swap not found' });
    }
    if (swap.requesterId !== userId && swap.recipientId !== userId) {
      return res.status(403).json({ error: 'You are not part of this swap' });
    }

    const isRequester = swap.requesterId === userId;
    const skillTaught = isRequester ? swap.offeredSkillId : swap.wantedSkillId;
    const taughtTo = isRequester ? swap.recipientId : swap.requesterId;

    const cooldownUntil = cooldownDays === null
      ? null
      : new Date(Date.now() + cooldownDays * 24 * 60 * 60 * 1000);

    await upsertCooldown({ userId, skillId: skillTaught, taughtToUserId: taughtTo, cooldownUntil });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Set cooldown error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function getTaughtSkill(req, res) {
  try {
    const { swapId } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT sr.requester_id AS requesterId, sr.recipient_id AS recipientId,
              os.id AS offeredSkillId, os.name AS offeredSkillName,
              ws.id AS wantedSkillId, ws.name AS wantedSkillName
       FROM swap_requests sr
       JOIN skills os ON os.id = sr.offered_skill_id
       JOIN skills ws ON ws.id = sr.wanted_skill_id
       WHERE sr.id = ? AND sr.status = 'completed'`,
      [swapId]
    );
    const swap = rows[0];
    if (!swap) {
      return res.status(404).json({ error: 'Completed swap not found' });
    }
    if (swap.requesterId !== userId && swap.recipientId !== userId) {
      return res.status(403).json({ error: 'You are not part of this swap' });
    }

    const isRequester = swap.requesterId === userId;
    const taughtSkillId = isRequester ? swap.offeredSkillId : swap.wantedSkillId;
    const taughtSkillName = isRequester ? swap.offeredSkillName : swap.wantedSkillName;

    return res.status(200).json({ skillId: taughtSkillId, skillName: taughtSkillName });
  } catch (err) {
    console.error('Get taught skill error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listTeachingCooldowns(req, res) {
  try {
    const cooldowns = await getTeachingCooldowns(req.user.id);
    return res.status(200).json({ cooldowns });
  } catch (err) {
    console.error('List teaching cooldowns error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function editCooldown(req, res) {
  try {
    const { skillId } = req.params;
    const { cooldownDays } = req.body;

    if (cooldownDays !== null && (cooldownDays < 0 || cooldownDays > 365)) {
      return res.status(400).json({ error: 'Cooldown must be between 0 and 365 days' });
    }

    const cooldownUntil = cooldownDays === null
      ? null
      : new Date(Date.now() + cooldownDays * 24 * 60 * 60 * 1000);

    const success = await updateTeachingCooldown(req.user.id, skillId, cooldownUntil);
    if (!success) {
      return res.status(404).json({ error: 'No existing cooldown found for this skill' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Edit cooldown error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { setCooldown, getTaughtSkill, listTeachingCooldowns, editCooldown };
