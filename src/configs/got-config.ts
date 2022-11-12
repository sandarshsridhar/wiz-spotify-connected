import * as dotenv from 'dotenv';

dotenv.config();

export const gotConfig = {
  requestTimeOutMs: Number.parseInt(process.env.GOT_REQUEST_TIMEOUT_MS || '5000'),
  retryLimit: Number.parseInt(process.env.GOT_RETRY_LIMIT || '3'),
  retryMaxDelayMs: Number.parseInt(process.env.GOT_RETRY_MAX_DELAY_MS || '20000')
};
