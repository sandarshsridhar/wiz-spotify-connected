import { Got } from 'got';
import NodeCache from 'node-cache';
import { container } from '../../app.js';
import { apiConfig } from '../../configs/spotify-config.js';
import { TYPES } from '../../utils/types.js';
import { getAuthToken } from './spotify-auth-service.js';

export const getCurrentlyPlayingSong = async () => {
  return (await get('me/player')).body;
};

export const getAudioAnalysis = async (id: string) => {
  const cacheManager = container.get<NodeCache>(TYPES.CacheManager);

  let audioAnalysis = cacheManager.get<string>(`audioAnalysis-${id}`);

  if (audioAnalysis) return audioAnalysis;

  audioAnalysis = (await get(`audio-analysis/${id}`)).body;

  cacheManager.set(`audioAnalysis-${id}`, audioAnalysis, 2 * 60 * 60);

  return audioAnalysis;
};

const get = async (path: string) => {
  const token = await getAuthToken();
  const httpClient = container.get<Got>(TYPES.HttpClient);
  return httpClient.get(`${apiConfig.url}/${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};
