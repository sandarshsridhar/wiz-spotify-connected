import * as dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  port: process.env.APP_PORT || '8888',
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:8888/callback',
  spotifyPlaybackCheckMaxDelayMs: Number.parseInt(process.env.SPOTIFY_PLAYBACK_CHECK_MAX_DELAY_MS ?? '3000')
};
