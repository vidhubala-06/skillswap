const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { initSocket } = require('./socket');
const cron = require('node-cron');
const { runReminderCheck } = require('./jobs/sessionReminders');
const { runExpiryCheck } = require('./jobs/expirePendingRequests');
const { runStaleSwapCheck } = require('./jobs/releaseStaleSwaps');


const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./modules/auth/auth.routes');
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillSwap API is running' });
});

const skillsRoutes = require('./modules/skills/skills.routes');
app.use('/api/skills', skillsRoutes);

const profileRoutes = require('./modules/profile/profile.routes');
app.use('/api/profile', profileRoutes);

const quizRoutes = require('./modules/quiz/quiz.routes');
app.use('/api/quiz', quizRoutes);

const matchingRoutes = require('./modules/matching/matching.routes');
app.use('/api/matches', matchingRoutes);

const swapRequestsRoutes = require('./modules/swapRequests/swapRequests.routes');
app.use('/api/swap-requests', swapRequestsRoutes);

const cooldownRoutes = require('./modules/swapRequests/cooldown.routes');
app.use('/api/skill-cooldowns', cooldownRoutes);

const chatRoutes = require('./modules/chat/chat.routes');
app.use('/api/chat', chatRoutes);

const notificationsRoutes = require('./modules/notifications/notifications.routes');
app.use('/api/notifications', notificationsRoutes);

const adminRoutes = require('./modules/admin/admin.routes');
app.use('/api/admin', adminRoutes);

const reportsRoutes = require('./modules/reports/reports.routes');
app.use('/api/reports', reportsRoutes);

const feedRoutes = require('./modules/feed/feed.routes');
app.use('/api/feed', feedRoutes);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

cron.schedule('*/5 * * * *', () => {
  console.log('Running session reminder check...');
  runReminderCheck().catch((err) => console.error('Reminder check failed:', err));
});

cron.schedule('0 0 * * *', () => {
  console.log('Running pending request expiry check...');
  runExpiryCheck().catch((err) => console.error('Expiry check failed:', err));
});

cron.schedule('0 1 * * *', () => {
  console.log('Running stale swap release check...');
  runStaleSwapCheck().catch((err) => console.error('Stale swap check failed:', err));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});