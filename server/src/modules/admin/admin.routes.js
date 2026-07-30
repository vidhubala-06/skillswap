const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../../middleware/auth.middleware');
const { 
  dashboard, listSuggestions, listAllSkills, addSkill, dismiss, listUsers,
  listReports, dismiss_report, warn, tempBan, permanentBan, listHandledReports,
  userDetail
} = require('./admin.controller');

router.use(requireAuth, requireAdmin);

router.get('/dashboard', dashboard);
router.get('/skills/suggestions', listSuggestions);
router.get('/skills', listAllSkills);
router.post('/skills', addSkill);
router.post('/skills/suggestions/:id/dismiss', dismiss);
router.get('/users', listUsers);
router.get('/users/:id', userDetail);

router.get('/reports', listReports);
router.get('/reports/handled', listHandledReports);
router.post('/reports/:id/dismiss', dismiss_report);
router.post('/reports/:id/warn', warn);
router.post('/reports/:id/temp-ban', tempBan);
router.post('/reports/:id/permanent-ban', permanentBan);

module.exports = router;