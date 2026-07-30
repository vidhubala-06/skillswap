const pool = require('../../db/pool');
const { getSwapDetails, scheduleSession, markComplete, getCompletionFlags, completeSwapTx, getSessionHistory, getOrCreateMeetingRoom } = require('./activeSwap.queries');
const { getIO } = require('../../socket');

async function loadSwap(req, res) {
  try {
    const swap = await getSwapDetails(req.params.id, req.user.id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }
    return res.status(200).json({ swap });
  } catch (err) {
    console.error('Load swap error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function schedule(req, res) {
  try {
    const { sessionDate, sessionTime } = req.body;
    if (!sessionDate || !sessionTime) {
      return res.status(400).json({ error: 'Session date and time are required' });
    }

    const success = await scheduleSession(req.params.id, {
      sessionDate,
      sessionTime,
      scheduledBy: req.user.id
    });
    if (!success) {
      return res.status(400).json({ error: 'This swap cannot be scheduled right now' });
    }

    getIO().to(req.params.id).emit('swap-updated', { swapId: req.params.id });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Schedule error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function history(req, res) {
  try {
    const sessions = await getSessionHistory(req.params.id);
    return res.status(200).json({ sessions });
  } catch (err) {
    console.error('History error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

async function markCompleteHandler(req, res) {
  const connection = await pool.getConnection();
  try {
    const swapId = req.params.id;
    const userId = req.user.id;

    const flags = await getCompletionFlags(swapId);
    if (!flags) {
      connection.release();
      return res.status(404).json({ error: 'Swap not found' });
    }

    const isRequester = flags.requesterId === userId;
    if (!isRequester && flags.recipientId !== userId) {
      connection.release();
      return res.status(403).json({ error: 'You are not part of this swap' });
    }

    const sessionDateTime = new Date(`${flags.sessionDate}T${flags.sessionTime}`);
    if (new Date() < sessionDateTime) {
      connection.release();
      return res.status(400).json({ error: 'You can only mark this complete after the scheduled session time has passed' });
    }

    await markComplete(swapId, userId, isRequester);

    const updatedFlags = await getCompletionFlags(swapId);
    const bothComplete = updatedFlags.requesterMarkedComplete && updatedFlags.recipientMarkedComplete;

    if (bothComplete) {
      await connection.beginTransaction();
      await completeSwapTx(connection, swapId, {
        requesterId: updatedFlags.requesterId,
        recipientId: updatedFlags.recipientId
      });
      await connection.commit();
    }

    getIO().to(swapId).emit('swap-updated', { 
      swapId, 
      requesterMarkedComplete: updatedFlags.requesterMarkedComplete,
      recipientMarkedComplete: updatedFlags.recipientMarkedComplete,
      swapCompleted: bothComplete
    });

    return res.status(200).json({
      success: true,
      requesterMarkedComplete: updatedFlags.requesterMarkedComplete,
      recipientMarkedComplete: updatedFlags.recipientMarkedComplete,
      swapCompleted: bothComplete
    });
  } catch (err) {
    await connection.rollback();
    console.error('Mark complete error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  } finally {
    connection.release();
  }
}

async function getMeetingRoom(req, res) {
  try {
    const swapId = req.params.id;
    const swap = await getSwapDetails(swapId, req.user.id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap not found' });
    }

    const roomId = await getOrCreateMeetingRoom(swapId);
    return res.status(200).json({ roomId, partnerName: swap.partnerName });
  } catch (err) {
    console.error('Get meeting room error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { loadSwap, schedule, markCompleteHandler, history, getMeetingRoom };