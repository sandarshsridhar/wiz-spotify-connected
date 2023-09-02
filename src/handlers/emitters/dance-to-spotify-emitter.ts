import NodeCache from 'node-cache';
import { EventEmitter } from 'node:events';
import { Mode } from '../../classes/type-definitions.js';
import { appConfig } from '../../configs/app-config.js';
import { getAudioAnalysis, getAudioFeatures, getCurrentlyPlayingSong } from '../../services/spotify/spotify-api-service.js';
import { DanceEngine } from '../../utils/dance-engine.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { Logger } from '../../utils/logger.js';
import { TYPES } from '../../utils/types.js';
import { apiConfig } from '../../configs/spotify-config.js';

export const emitDanceToSpotifyEvent = async (mode: Mode): Promise<void> => {
  const eventBus = container.get<EventEmitter>(TYPES.EventBus);
  const logger = container.get<Logger>(TYPES.Logger);
  const cacheManager = container.get<NodeCache>(TYPES.CacheManager);
  const danceEngine = container.get<DanceEngine>(TYPES.DanceEngine);

  let playbackCheckAttempt = 0;
  let currentlyPlaying = await getCurrentlyPlayingSong();
  let alternateBrightness = true; // This makes the effect pop more.
  let timer = process.hrtime();

  while (true) {
    if (currentlyPlaying && cacheManager.get('instance') === 'running') {
      const song = currentlyPlaying;
      const features = await getAudioFeatures(song.id);
      const analysis = await getAudioAnalysis(song.id);
      const beatsMap = danceEngine.getBeatsMap(analysis, song.id);

      if (song.isPlaying) {
        playbackCheckAttempt = 0;

        logger.debug(`Playing: ${song.name}`);

        const beats = danceEngine.getBeats(beatsMap, song);
        const isPartyMode = danceEngine.isPartyMode(mode, features);
        const lights = danceEngine.translateBeatsToLights(beats, isPartyMode, alternateBrightness);

        eventBus.emit('changeLights', lights.brightness, lights.colorSpace);

        await sleep(lights.delayMs);

        alternateBrightness = !alternateBrightness;
      } else {
        const waitMs = calculateDelay(playbackCheckAttempt);

        logger.info(`Playback paused: ${song.name}. Waiting ${waitMs / 1000} seconds...`);

        await sleep(waitMs);

        playbackCheckAttempt++;
      }

      setImmediate(async () => {
        if (isLaterThanPollingDelay(timer)) {
          currentlyPlaying = await getCurrentlyPlayingSong();
          timer = process.hrtime();
        }
      });
    } else {
      if (!currentlyPlaying) {
        logger.warn('Nothing is playing currently!');
      }
      return;
    }
  }
};

const sleep = async (timeMs: number) => {
  return new Promise<void>((r) => setTimeout(r, timeMs));
};

const calculateDelay = (attempt: number): number => {
  return Math.min((Math.pow(2, attempt) * 1000), appConfig.spotifyPlaybackCheckMaxDelayMs);
};

const isLaterThanPollingDelay = (timer: [number, number]): boolean => {
  const billion = 1000000000;
  const million = 1000000;
  const elapsedTimeMs = (process.hrtime(timer)[0] * billion + process.hrtime(timer)[1]) / million;

  return elapsedTimeMs > apiConfig.pollingDelayMs;
};
