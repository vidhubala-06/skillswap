const { getDashboardData } = require('./dashboard.queries');

async function getDashboard(req, res) {
  try {
    const data = await getDashboardData(req.user.id);
    return res.status(200).json(data);
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { getDashboard };