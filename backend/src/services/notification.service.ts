import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer';
import { Job, AIScore } from '../types';

const telegramBot = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function escapeHtml(str: string): string {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function sendTelegramAlert(chatId: string, job: Job, score: AIScore): Promise<void> {
  if (!telegramBot) return;

  const message = `🎯 High Match Job Alert!\n\n` +
    `📋 ${job.title}\n` +
    `🏢 ${job.company || 'N/A'}\n` +
    `📍 ${job.location || 'N/A'}\n` +
    `💯 Match Score: ${score.match_score}%\n\n` +
    `${score.summary}\n\n` +
    `🔗 ${job.url || 'No URL'}`;

  await telegramBot.sendMessage(chatId, message);
}

export async function sendEmailAlert(email: string, job: Job, score: AIScore): Promise<void> {
  const html = `
    <h2>🎯 High Match Job Alert!</h2>
    <h3>${escapeHtml(job.title)}</h3>
    <p><strong>Company:</strong> ${escapeHtml(job.company || 'N/A')}</p>
    <p><strong>Location:</strong> ${escapeHtml(job.location || 'N/A')}</p>
    <p><strong>Match Score:</strong> ${score.match_score}%</p>
    <p>${escapeHtml(score.summary || '')}</p>
    <p><strong>Reasoning:</strong> ${escapeHtml(score.reasoning || '')}</p>
    ${job.url ? `<p><a href="${encodeURI(job.url)}">View Job Posting</a></p>` : ''}
  `;

  await emailTransporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@jobai.com',
    to: email,
    subject: `High Match: ${job.title} at ${job.company}`,
    html,
  });
}
