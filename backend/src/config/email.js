import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments,
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    throw error;
  }
};

export const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to KanoConnect!</h2>
      <p>Hi ${user.firstName},</p>
      <p>Your account has been created successfully. You can now start using KanoConnect to manage your logistics needs.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Account Type:</strong> ${user.role}</p>
        <p style="margin: 10px 0 0;"><strong>Email:</strong> ${user.email}</p>
      </div>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The KanoConnect Team</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Welcome to KanoConnect!', html });
};

export const sendShipmentNotification = async (user, shipment) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Shipment Update</h2>
      <p>Hi ${user.firstName},</p>
      <p>Your shipment <strong>${shipment.trackingNumber}</strong> has been updated.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Status:</strong> ${shipment.status}</p>
        <p style="margin: 10px 0 0;"><strong>From:</strong> ${shipment.pickupAddress}</p>
        <p style="margin: 10px 0 0;"><strong>To:</strong> ${shipment.deliveryAddress}</p>
      </div>
      <p>Track your shipment in real-time on the KanoConnect dashboard.</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: `Shipment Update - ${shipment.trackingNumber}`, html });
};

export default transporter;
