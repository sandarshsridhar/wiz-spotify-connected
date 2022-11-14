import * as dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  port: process.env.APP_PORT || '8888',
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:8888/callback'
};
