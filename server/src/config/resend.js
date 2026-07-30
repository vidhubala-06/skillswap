const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(toEmail, token) {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: 'SkillSwap <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Verify your SkillSwap account',
    html: `
      <h2>Welcome to SkillSwap!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>This link expires in 24 hours.</p>
    `
  });
}

async function sendPasswordResetEmail(toEmail, token) {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: 'SkillSwap <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Reset your SkillSwap password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `
  });
}

async function sendSwapRequestEmail(toEmail, requesterName, skillName) {
  await resend.emails.send({
    from: 'SkillSwap <onboarding@resend.dev>',
    to: toEmail,
    subject: 'New Swap Request on SkillSwap',
    html: `
      <h2>You have a new swap request!</h2>
      <p><strong>${requesterName}</strong> wants to learn <strong>${skillName}</strong> from you.</p>
      <p>Log in to SkillSwap to view and respond to this request.</p>
    `
  });
}

async function sendSwapAcceptedEmail(toEmail, recipientName) {
  await resend.emails.send({
    from: 'SkillSwap <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Your Swap Request was Accepted!',
    html: `
      <h2>Good news!</h2>
      <p><strong>${recipientName}</strong> accepted your swap request.</p>
      <p>Log in to SkillSwap to schedule your session.</p>
    `
  });
}

async function sendSwapRejectedEmail(toEmail, recipientName, reason) {
  await resend.emails.send({
    from: 'SkillSwap <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Update on Your Swap Request',
    html: `
      <h2>Swap Request Declined</h2>
      <p><strong>${recipientName}</strong> declined your swap request.</p>
      <p><strong>Reason:</strong> ${reason}</p>
    `
  });
}

async function sendSessionReminderEmail(toEmail, partnerName, sessionDate, sessionTime, hoursUntil) {
  await resend.emails.send({
    from: 'SkillSwap <onboarding@resend.dev>',
    to: toEmail,
    subject: hoursUntil === 1 ? 'Your SkillSwap Session Starts in 1 Hour' : 'Your SkillSwap Session is Today',
    html: `
      <h2>Session Reminder</h2>
      <p>Your session with <strong>${partnerName}</strong> is scheduled for ${sessionDate} at ${sessionTime}.</p>
      <p>${hoursUntil === 1 ? 'Starting in about an hour — don\'t miss it!' : 'This is happening today!'}</p>
    `
  });
}

module.exports = { 
  sendVerificationEmail, sendPasswordResetEmail,
  sendSwapRequestEmail, sendSwapAcceptedEmail, sendSwapRejectedEmail, sendSessionReminderEmail
};