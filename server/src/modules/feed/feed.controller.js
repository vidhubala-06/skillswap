const fs = require('fs');
const cloudinary = require('../../config/cloudinary');
const {
  hasCompletedSwap, createProject, addProjectImage, addProjectTechnology,
  getFeedPage, getImagesForProjects, getTechnologiesForProjects,
  getCachedFirstPage, setCachedFirstPage, invalidateFeedCache,
  getProjectsByUser, getUserKnownSkillBadges, reportProject
} = require('./feed.queries');
const pool = require('../../db/pool');
const { getIO } = require('../../socket');

async function checkEligibility(req, res) {
    try {
        const eligible = await hasCompletedSwap(req.user.id);
        return res.status(200).json({ eligible });
    } catch (err) {
        console.error('Check eligibility error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

async function postProject(req, res) {
    try {
        const userId = req.user.id;
        const { description, repoUrl, skillIds } = req.body;
        const files = req.files || [];

        const eligible = await hasCompletedSwap(userId);
        if (!eligible) {
            files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
            return res.status(403).json({ error: 'You must complete at least one swap before posting a project' });
        }

        if (!description || description.trim().length === 0) {
            files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
            return res.status(400).json({ error: 'Description is required' });
        }

        if (files.length > 5) {
            files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
            return res.status(400).json({ error: 'Maximum 5 images allowed' });
        }

        const parsedSkillIds = skillIds ? JSON.parse(skillIds) : [];

        const projectId = await createProject({ userId, description: description.trim(), repoUrl });

        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, { resource_type: 'image' });
            fs.unlinkSync(file.path);
            await addProjectImage(projectId, result.secure_url);
        }

        for (const skillId of parsedSkillIds) {
            await addProjectTechnology(projectId, skillId);
        }

        await invalidateFeedCache();
        getIO().emit('feed:new-post');

        return res.status(201).json({ success: true, projectId });
    } catch (err) {
        console.error('Post project error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

async function getFeed(req, res) {
  try {
    const { skillId, cursorCreatedAt, cursorId } = req.query;
    const isFirstPageUnfiltered = !skillId && !cursorCreatedAt && !cursorId;

    let projects;
    let fromCache = false;

    if (isFirstPageUnfiltered) {
      const cached = await getCachedFirstPage();
      if (cached) {
        return res.status(200).json({ ...cached, fromCache: true });
      }
    }

    projects = await getFeedPage({
      skillId: skillId ? parseInt(skillId, 10) : null,
      cursorCreatedAt: cursorCreatedAt || null,
      cursorId: cursorId || null
    });

    const projectIds = projects.map(p => p.id);
    const images = await getImagesForProjects(projectIds);
    const technologies = await getTechnologiesForProjects(projectIds);

    const enriched = projects.map(p => ({
      ...p,
      images: images.filter(i => i.projectId === p.id).map(i => i.imageUrl),
      technologies: technologies.filter(t => t.projectId === p.id).map(t => ({ id: t.skillId, name: t.skillName }))
    }));

    const responseData = { projects: enriched };

    if (isFirstPageUnfiltered) {
      await setCachedFirstPage(responseData);
    }

    return res.status(200).json({ ...responseData, fromCache: false });
  } catch (err) {
    console.error('Get feed error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function getUserFeedProfile(req, res) {
  try {
    const { userId } = req.params;

    const [nameRows] = await pool.query('SELECT name FROM profiles WHERE user_id = ?', [userId]);
    if (nameRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const projects = await getProjectsByUser(userId);
    const projectIds = projects.map(p => p.id);
    const images = await getImagesForProjects(projectIds);
    const technologies = await getTechnologiesForProjects(projectIds);

    const enriched = projects.map(p => ({
      ...p,
      images: images.filter(i => i.projectId === p.id).map(i => i.imageUrl),
      technologies: technologies.filter(t => t.projectId === p.id).map(t => ({ id: t.skillId, name: t.skillName }))
    }));

    const skillBadges = await getUserKnownSkillBadges(userId);

    return res.status(200).json({ name: nameRows[0].name, skillBadges, projects: enriched });
  } catch (err) {
    console.error('Get user feed profile error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function submitProjectReport(req, res) {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'A reason is required' });
    }
    await reportProject({ projectId: req.params.id, reporterId: req.user.id, reason: reason.trim() });
    return res.status(201).json({ success: true, message: 'Report submitted.' });
  } catch (err) {
    console.error('Report project error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { checkEligibility, postProject, getFeed, getUserFeedProfile, submitProjectReport };