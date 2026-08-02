const { 
  getDashboardStats, getPendingSuggestions, createSkillDirect, 
  markSuggestionHandled, dismissSuggestion, getAllSkills, getUsersList,
  getUserDetail, getAllProjectsForAdmin, deleteProjectAdmin,
  getPendingProjectReports, dismissProjectReport
} = require('./admin.queries');
const { normalize } = require('../../utils/normalize');
const { generateQuestionBankForSkill } = require('../quiz/quiz.service');
const { getPendingReports, dismissReport, issueWarning, tempBanUser, permanentBanUser, getHandledReports } = require('../reports/reports.queries');
const { invalidateFeedCache } = require('../feed/feed.queries');

async function dashboard(req, res) {
    try {
        const stats = await getDashboardStats();
        return res.status(200).json(stats);
    } catch (err) {
        console.error('Admin dashboard error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

async function listSuggestions(req, res) {
  try {
    const suggestions = await getPendingSuggestions();
    return res.status(200).json({ suggestions });
  } catch (err) {
    console.error('List suggestions error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listAllSkills(req, res) {
  try {
    const skills = await getAllSkills();
    return res.status(200).json({ skills });
  } catch (err) {
    console.error('List skills error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function addSkill(req, res) {
  try {
    const { name, suggestionId } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Skill name must be at least 2 characters' });
    }

    const normalizedName = normalize(name);
    const skillId = await createSkillDirect({
      name: name.trim(),
      normalizedName,
      createdBy: req.user.id
    });

    if (suggestionId) {
      await markSuggestionHandled(suggestionId, skillId);
    }

    // Generate quiz question bank for this new skill (async, don't block the response for too long)
    generateQuestionBankForSkill(skillId, name.trim())
      .then(() => console.log(`Generated questions for new skill: ${name}`))
      .catch((err) => console.error(`Failed to generate questions for ${name}:`, err.message));

    return res.status(201).json({ success: true, skillId, message: 'Skill added. Quiz questions are generating in the background.' });
  } catch (err) {
    console.error('Add skill error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function dismiss(req, res) {
  try {
    await dismissSuggestion(req.params.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Dismiss error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listUsers(req, res) {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { users, total } = await getUsersList({ search, limit, offset });
    return res.status(200).json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listReports(req, res) {
  try {
    const reports = await getPendingReports();
    return res.status(200).json({ reports });
  } catch (err) {
    console.error('List reports error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function dismiss_report(req, res) {
  try {
    await dismissReport(req.params.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Dismiss report error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function warn(req, res) {
  try {
    const { message } = req.body;
    const { userId } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'A warning message is required' });
    }
    await issueWarning({ reportId: req.params.id, userId, message: message.trim(), issuedBy: req.user.id });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Warn error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function tempBan(req, res) {
  try {
    const { userId, days } = req.body;
    if (!days || days < 1 || days > 365) {
      return res.status(400).json({ error: 'Days must be between 1 and 365' });
    }
    await tempBanUser({ reportId: req.params.id, userId, days });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Temp ban error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function permanentBan(req, res) {
  try {
    const { userId } = req.body;
    await permanentBanUser({ reportId: req.params.id, userId });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Permanent ban error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listHandledReports(req, res) {
  try {
    const reports = await getHandledReports();
    return res.status(200).json({ reports });
  } catch (err) {
    console.error('List handled reports error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function userDetail(req, res) {
  try {
    const detail = await getUserDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(detail);
  } catch (err) {
    console.error('User detail error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listProjects(req, res) {
  try {
    const projects = await getAllProjectsForAdmin();
    return res.status(200).json({ projects });
  } catch (err) {
    console.error('List projects error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function deleteProject(req, res) {
  try {
    await deleteProjectAdmin(req.params.id);
    await invalidateFeedCache();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete project error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function listProjectReports(req, res) {
  try {
    const reports = await getPendingProjectReports();
    return res.status(200).json({ reports });
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function dismissProjectReportHandler(req, res) {
  try {
    await dismissProjectReport(req.params.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { 
  dashboard, listSuggestions, listAllSkills, addSkill, dismiss, listUsers,
  listReports, dismiss_report, warn, tempBan, permanentBan, listHandledReports,
  userDetail, listProjects, deleteProject, listProjectReports, dismissProjectReportHandler
};