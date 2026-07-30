const { getNotifications, markRead, markAllRead, getUnreadCount } = require('./notifications.queries');

async function list(req, res) {
    try {
        const notifications = await getNotifications(req.user.id);
        return res.status(200).json({ notifications });
    } catch (err) {
        console.error('List notifications error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

async function read(req, res) {
    try {
        await markRead(req.params.id, req.user.id);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Mark read error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

async function readAll(req, res) {
    try {
        await markAllRead(req.user.id);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Mark all read error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

async function unreadCount(req, res) {
    try {
        const count = await getUnreadCount(req.user.id);
        return res.status(200).json({ count });
    } catch (err) {
        console.error('Unread count error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

module.exports = { list, read, readAll, unreadCount };