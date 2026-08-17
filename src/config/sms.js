import logger from '../utils/logger.js';

const SMS_PROVIDER = process.env.SMS_PROVIDER || 'console';
const SMS_FROM = process.env.SMS_FROM || 'KanoConnect';

const statusMessages = {
  confirmed: 'has been CONFIRMED. Your rider will arrive soon.',
  picked_up: 'has been PICKED UP and is on the way.',
  in_transit: 'is IN TRANSIT to its destination.',
  at_hub: 'has arrived at our HUB for sorting.',
  out_for_delivery: 'is OUT FOR DELIVERY. Expect it today!',
  delivered: 'has been DELIVERED successfully. Thank you for choosing KanoConnect!',
  cancelled: 'has been CANCELLED. Contact support for details.',
  returned: 'has been RETURNED to sender.',
};

const sendSMS = async ({ to, message }) => {
  if (!to) {
    logger.warn('SMS skipped: no recipient number');
    return;
  }

  switch (SMS_PROVIDER) {
    case 'africastalking':
      try {
        const credentials = {
          apiKey: process.env.AT_API_KEY,
          username: process.env.AT_USERNAME || 'sandbox',
        };
        const AfricaTalking = (await import('africastalking')).default;
        const client = AfricaTalking(credentials);
        const response = await client.SMS.send({ to: [to], message, from: SMS_FROM });
        logger.info(`SMS sent via Africa's Talking: ${response.SMSMessageData?.Message}`);
        return response;
      } catch (error) {
        logger.error(`SMS error (Africa's Talking): ${error.message}`);
        throw error;
      }

    case 'twilio':
      try {
        const twilio = (await import('twilio')).default;
        const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        const response = await client.messages.create({ body: message, from: SMS_FROM, to });
        logger.info(`SMS sent via Twilio: ${response.sid}`);
        return response;
      } catch (error) {
        logger.error(`SMS error (Twilio): ${error.message}`);
        throw error;
      }

    default:
      logger.info(`[SMS] To: ${to} | From: ${SMS_FROM} | ${message}`);
      return { simulated: true, to, message };
  }
};

export const sendShipmentSMS = async (user, shipment) => {
  const phone = user?.phone;
  if (!phone) {
    logger.warn(`SMS skipped: no phone for user ${user?._id}`);
    return;
  }

  const template = statusMessages[shipment.status];
  if (!template) {
    logger.warn(`SMS skipped: no template for status ${shipment.status}`);
    return;
  }

  const message = `KanoConnect: Your shipment ${shipment.trackingNumber} ${template}`;
  return sendSMS({ to: phone, message });
};

export const sendWelcomeSMS = async (user) => {
  const phone = user?.phone;
  if (!phone) return;

  const message = `Welcome to KanoConnect, ${user.firstName}! Your account has been created. Start tracking your deliveries today.`;
  return sendSMS({ to: phone, message });
};

export default { sendSMS, sendShipmentSMS, sendWelcomeSMS };
