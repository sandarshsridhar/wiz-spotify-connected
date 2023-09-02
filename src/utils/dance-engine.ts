import { inject, injectable } from 'inversify';
import NodeCache from 'node-cache';
import { AudioAnalysis } from '../classes/audio-analysis.js';
import { AudioFeatures } from '../classes/audio-features.js';
import { CurrentlyPlaying } from '../classes/currently-playing.js';
import { Beats, Mode } from '../classes/type-definitions.js';
import { getColorSpace } from './color-picker.js';
import { TYPES } from './types.js';

@injectable()
export class DanceEngine {
  constructor(@inject(TYPES.CacheManager) private readonly _cacheManager: NodeCache) { }

  public isPartyMode(mode: Mode, features: AudioFeatures): boolean {
    if (mode === Mode.calm) return false;

    if (mode === Mode.party) return true;

    const isSongPartyable = this._cacheManager.get<boolean>(`isSongPartyable-${features.id}`);

    if (isSongPartyable !== undefined) {
      return isSongPartyable;
    } else {
      switch (true) {
        case (features.danceability >= 0.7 && features.energy >= 0.45):
        case (features.energy >= 0.75 && features.danceability >= 0.5):
        case (features.danceability >= 0.6 && features.energy >= 0.6 && features.tempo >= 90 && features.tempo <= 130):
          this._cacheManager.set(`isSongPartyable-${features.id}`, true);
          return true;

        default:
          this._cacheManager.set(`isSongPartyable-${features.id}`, false);
          return false;
      }
    }
  }

  public getBeats(beatsMap: Array<{ start: number, end: number, beats: Beats }>, cpSong: CurrentlyPlaying): Beats {
    const progress = cpSong.progressMs / 1000;
    return beatsMap.filter(bMap => progress >= bMap.start && progress < bMap.end)[0].beats;
  }

  public getBeatsMap(analysis: AudioAnalysis, id: string) {
    let beatsMap = this._cacheManager.get<Array<{ start: number, end: number, beats: Beats }>>(`beatsMap-${id}`) ?? [];

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

    this._cacheManager.set(`beatsMap-${id}`, beatsMap);

    return beatsMap;
  }

  public translateBeatsToLights(beats: Beats, isPartyMode: boolean, alternateBrightness: boolean) {
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

    if (lights.delayMs === Infinity) {
      lights.delayMs = 500;
    }

    return lights;
  }
}
