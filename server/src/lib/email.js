import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter = null;

function getTransporter() {
  if (!config.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(email, resetLink) {
  const transport = getTransporter();
  if (!transport) {
    console.log('\n==============================================');
    console.log('[dev] Password reset requested for:', email);
    console.log('[dev] Reset link:', resetLink);
    console.log('==============================================\n');
    return { delivered: false, devLink: resetLink };
  }
  await transport.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'CutTrack — Reset your password',
    text: `You requested a password reset. Open this link within 1 hour to set a new password:\n\n${resetLink}\n\nIf you didn't request this, ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Reset your password</a> (valid for 1 hour).</p><p>If you didn't request this, ignore this email.</p>`
  });
  return { delivered: true };
}
