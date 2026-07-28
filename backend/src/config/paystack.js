import axios from 'axios';
import logger from '../utils/logger.js';

const paystackAPI = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const initializePayment = async ({ email, amount, metadata = {}, callback_url }) => {
  try {
    const response = await paystackAPI.post('/transaction/initialize', {
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      metadata,
      callback_url,
    });
    return response.data;
  } catch (error) {
    logger.error(`Paystack initialize error: ${error.message}`);
    throw error;
  }
};

export const verifyPayment = async (reference) => {
  try {
    const response = await paystackAPI.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    logger.error(`Paystack verify error: ${error.message}`);
    throw error;
  }
};

export const createTransferRecipient = async ({ type, name, account_number, bank_code }) => {
  try {
    const response = await paystackAPI.post('/transferrecipient', {
      type,
      name,
      account_number,
      bank_code,
    });
    return response.data;
  } catch (error) {
    logger.error(`Paystack transfer recipient error: ${error.message}`);
    throw error;
  }
};

export const initiateTransfer = async ({ source, amount, recipient, reason }) => {
  try {
    const response = await paystackAPI.post('/transfer', {
      source,
      amount: amount * 100,
      recipient,
      reason,
    });
    return response.data;
  } catch (error) {
    logger.error(`Paystack transfer error: ${error.message}`);
    throw error;
  }
};

export const listBanks = async (country = 'nigeria') => {
  try {
    const response = await paystackAPI.get(`/bank?country=${country}`);
    return response.data;
  } catch (error) {
    logger.error(`Paystack list banks error: ${error.message}`);
    throw error;
  }
};

export default paystackAPI;
