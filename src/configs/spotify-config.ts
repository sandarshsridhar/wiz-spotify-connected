import * as dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID || 'DEFAULT_CLIENT_ID',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'DEFAULT_CLIENT_SECRET',
  authUrl: process.env.SPOTIFY_AUTH_URL || 'https://accounts.spotify.com/authorize',
  tokenUrl: process.env.SPOTIFY_TOKEN_URL || 'https://accounts.spotify.com/api/token'
};

export const apiConfig = {
  url: process.env.SPOTIFY_API_URL || 'https://api.spotify.com/v1',
  pollingDelayMs: Number.parseInt(process.env.SPOTIFY_POLLING_DELAY_MS || '1000')
};
