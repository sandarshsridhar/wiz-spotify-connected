import { plainToInstance } from 'class-transformer';
import { Got } from 'got';
import NodeCache from 'node-cache';
import { AudioAnalysis } from '../../classes/audio-analysis.js';
import { CurrentlyPlaying } from '../../classes/currently-playing.js';
import { apiConfig } from '../../configs/spotify-config.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { TYPES } from '../../utils/types.js';
import { getAuthToken } from './spotify-auth-service.js';

export const getCurrentlyPlayingSong = async (retryCount = 0): Promise<CurrentlyPlaying | null> => {
  let result = await get('me/player');
  const retryLimit = 5;

  if (result.body) {
    const currentlyPlaying = JSON.parse(result.body);

    // Below lines of code is to account for Spotify returning empty item (track) some times. A retry should work.
    if (currentlyPlaying.item) {
      return plainToInstance(CurrentlyPlaying, currentlyPlaying);
    } else {
      if (retryCount++ < retryLimit) return getCurrentlyPlayingSong(retryCount);
    }
  }

  return null;
};

export const getAudioAnalysis = async (id: string) => {
  const cacheManager = container.get<NodeCache>(TYPES.CacheManager);

  let audioAnalysis = cacheManager.get<AudioAnalysis>(`audioAnalysis-${id}`);

  if (audioAnalysis) return audioAnalysis;

  const result = (await get(`audio-analysis/${id}`)).body;

  audioAnalysis = plainToInstance(AudioAnalysis, JSON.parse(result));

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
