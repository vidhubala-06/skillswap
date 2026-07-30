const { getStaleActiveSwaps, releaseStaleSwap, getStaleUnscheduledSwaps } = require('../modules/swapRequests/staleSwap.queries');
const { createNotification } = require('../modules/notifications/notifications.queries');

async function runStaleSwapCheck() {
  const staleScheduledSwaps = await getStaleActiveSwaps();
  const staleUnscheduledSwaps = await getStaleUnscheduledSwaps();
  const allStale = [...staleScheduledSwaps, ...staleUnscheduledSwaps];

  for (const swap of allStale) {
    try {
      await releaseStaleSwap(swap.id, swap.requesterId, swap.recipientId);

      await createNotification({
        userId: swap.requesterId,
        type: 'swap_request_cancelled',
        message: 'Your swap was automatically closed due to prolonged inactivity.',
        relatedSwapId: swap.id
      });
      await createNotification({
        userId: swap.recipientId,
        type: 'swap_request_cancelled',
        message: 'Your swap was automatically closed due to prolonged inactivity.',
        relatedSwapId: swap.id
      });

      console.log(`Stale swap ${swap.id} auto-released`);
    } catch (err) {
      console.error(`Failed to release stale swap ${swap.id}:`, err.message);
    }
  }
}

module.exports = { runStaleSwapCheck };