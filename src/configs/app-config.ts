import * as dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  port: process.env.APP_PORT || '1251',
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:1251/api/callback'
};
