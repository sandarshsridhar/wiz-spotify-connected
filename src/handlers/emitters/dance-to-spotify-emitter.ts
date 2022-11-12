import NodeCache from 'node-cache';
import { EventEmitter } from 'node:events';
import { container } from '../../app.js';
import { AudioAnalysis } from '../../classes/audio-analysis.js';
import { CurrentlyPlaying } from '../../classes/currently-playing.js';
import { Beats } from '../../classes/type-definitions.js';
import { apiConfig } from '../../configs/spotify-config.js';
import { getAudioAnalysis, getCurrentlyPlayingSong } from '../../services/spotify/spotify-api-service.js';
import { getColorSpace } from '../../utils/color-picker.js';
import { TYPES } from '../../utils/types.js';

export const emitDanceToSpotifyEvent = async (roomIds: Array<string>): Promise<void> => {
  const eventBus = container.get<EventEmitter>(TYPES.EventBus);
  let pollingDelay = apiConfig.pollingDelayMs;
  let retries = 0;
  let currentlyPlaying = await getCurrentlyPlayingSong();
  let alternateBrightness = true;

  while (true) {
    if (currentlyPlaying) {
      const song = currentlyPlaying;
      const analysis = await getAudioAnalysis(song.id);
      const beatsMap = getBeatsMap(analysis, song.id);

      if (song.isPlaying) {
        pollingDelay = apiConfig.pollingDelayMs;
        retries = 0;

        const beats = getBeats(beatsMap, song);
        const lights = translateBeatsToLights(beats);

        eventBus.emit('changeLights', roomIds, alternateBrightness ? lights.brightness : 10, lights.colorSpace);
        pollingDelay = lights.delayMs;
        alternateBrightness = !alternateBrightness;
      } else {
        pollingDelay = Math.pow(2, retries) * 1000;
        console.log(`Playback paused: ${song.id}. Waiting ${pollingDelay / 1000} seconds...`);
        retries < 3 ? retries++ : retries;
      }

      await new Promise<void>(r => setTimeout(r, pollingDelay));

      currentlyPlaying = await getCurrentlyPlayingSong();
    } else {
      console.log('Nothing is playing currently!');
      return;
    }
  }
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
        relativeLoudness: (100 + s.loudness) * highestRelativeLoudness / 100,
        key: s.key
      }
    });
  });

  cacheManager.set(`beatsMap-${id}`, beatsMap);

  return beatsMap;
};

const translateBeatsToLights = (beats: Beats) => {
  const lights = {
    delayMs: Math.max((1000 / beats.beatsPerSec) - 100, 100), // Reduce delay to account for computation and API call latencies
    colorSpace: getColorSpace(beats.key),
    brightness: Math.max(10, Math.round(beats.relativeLoudness))
  };

  return lights;
};
