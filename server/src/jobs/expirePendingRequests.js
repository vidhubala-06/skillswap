const { getExpiredPendingRequests, cancelExpiredRequest } = require('../modules/swapRequests/expiry.queries');
const { createNotification } = require('../modules/notifications/notifications.queries');
const { getIO } = require('../socket');

async function runExpiryCheck() {
    const expired = await getExpiredPendingRequests();

    for (const request of expired) {
        try {
            await cancelExpiredRequest(request.id);
            await createNotification({
                userId: request.requesterId,
                type: 'swap_request_cancelled',
                message: 'Your swap request expired after 7 days with no response.',
                relatedSwapId: request.id
            });
            getIO().to(request.requesterId).emit('swap-request-updated');
            console.log(`Expired pending request ${request.id} auto-cancelled`);
        } catch (err) {
            console.error(`Failed to expire request ${request.id}:`, err.message);
        }
    }
}

module.exports = { runExpiryCheck };