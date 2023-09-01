import NodeCache from 'node-cache';
import { EventEmitter } from 'node:events';
import { AudioAnalysis } from '../../classes/audio-analysis.js';
import { CurrentlyPlaying } from '../../classes/currently-playing.js';
import { Beats, Mode } from '../../classes/type-definitions.js';
import { apiConfig } from '../../configs/spotify-config.js';
import { getAudioAnalysis, getAudioFeatures, getCurrentlyPlayingSong } from '../../services/spotify/spotify-api-service.js';
import { getColorSpace } from '../../utils/color-picker.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { Logger } from '../../utils/logger.js';
import { TYPES } from '../../utils/types.js';
import { appConfig } from '../../configs/app-config.js';
import { AudioFeatures } from '../../classes/audio-features.js';

export const emitDanceToSpotifyEvent = async (mode: Mode): Promise<void> => {
  const eventBus = container.get<EventEmitter>(TYPES.EventBus);
  const logger = container.get<Logger>(TYPES.Logger);
  const cacheManager = container.get<NodeCache>(TYPES.CacheManager);

  let playbackCheckAttempt = 0;
  let currentlyPlaying = await getCurrentlyPlayingSong();
  let alternateBrightness = true; // This makes the effect pop more.
  let timer = process.hrtime();

  while (true) {
    if (currentlyPlaying && cacheManager.get('instance') === 'running') {
      const song = currentlyPlaying;
      const features = await getAudioFeatures(song.id);
      const analysis = await getAudioAnalysis(song.id);
      const beatsMap = getBeatsMap(analysis, song.id);

      if (song.isPlaying) {
        playbackCheckAttempt = 0;

        logger.debug(`Playing: ${song.name}`);

        const beats = getBeats(beatsMap, song);
        const lights = translateBeatsToLights(beats, isPartyMode(mode, features), alternateBrightness);

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

const isPartyMode = (mode: Mode, features: AudioFeatures): boolean => {
  if (mode === Mode.auto) {
    if (features.danceability > 0.5 && features.energy > 0.5 && features.valence > 0.5) return true;

    return false;
  }

  return mode === Mode.party;
};

const isLaterThanPollingDelay = (timer: [number, number]) => {
  const billion = 1000000000;
  const million = 1000000;
  const elapsedTimeMs = (process.hrtime(timer)[0] * billion + process.hrtime(timer)[1]) / million;

  return elapsedTimeMs > apiConfig.pollingDelayMs;
};

const sleep = async (timeMs: number) => {
  return new Promise<void>((r) => setTimeout(r, timeMs));
};

const getBeats = (beatsMap: Array<{ start: number, end: number, beats: Beats }>, cpSong: CurrentlyPlaying): Beats => {
  const progress = cpSong.progressMs / 1000;
  return beatsMap.filter(bMap => progress >= bMap.start && progress < bMap.end)[0].beats;
};

const getBeatsMap = (analysis: AudioAnalysis, id: string) => {
  const cacheManager = container.get<NodeCache>(TYPES.CacheManager);

  let beatsMap = cacheManager.get<Array<{ start: number, end: number, beats: Beats }>>(`beatsMap-${id}`) ?? [];

  if (beatsMap.length > 0) return beatsMap;

  const highestRelativeLoudness = 100 + analysis.sections
    .reduce((result, section) => result > section.loudness ? result : section.loudness, -Infinity);

  analysis.sections.forEach(s => {
    beatsMap.push({
      start: s.start,
      end: s.start + s.duration,
      beats: {
        beatsPerSec: s.tempo / 60,
        relativeLoudness: (100 + s.loudness) * 100 / highestRelativeLoudness,
        key: s.key
      }
    });
  });

  cacheManager.set(`beatsMap-${id}`, beatsMap);

  return beatsMap;
};

const translateBeatsToLights = (beats: Beats, isPartyMode: boolean, alternateBrightness: boolean) => {
  const lights = {
    delayMs: 1000 / beats.beatsPerSec,
    colorSpace: getColorSpace(beats.key),
    brightness: Math.max(10, Math.round(beats.relativeLoudness))
  };

  if (isPartyMode) {
    lights.brightness = alternateBrightness ? lights.brightness : 10;
  } else {
    lights.brightness = alternateBrightness ? lights.brightness : Math.round(0.5 * lights.brightness);
    lights.delayMs = 2 * lights.delayMs;
  }

  return lights;
};

const calculateDelay = (attempt: number): number => {
  return Math.min((Math.pow(2, attempt) * 1000), appConfig.spotifyPlaybackCheckMaxDelayMs);
};
