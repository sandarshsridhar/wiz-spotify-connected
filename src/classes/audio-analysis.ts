import { Expose } from 'class-transformer';
import { Ran } from './type-definitions.js';
export class AudioAnalysis {
  @Expose()
  sections: Array<Section>;
}

class Section {
  @Expose()
  start: number;

  @Expose()
  duration: number;

  @Expose()
  loudness: number;

  @Expose()
  tempo: number;

  @Expose()
  key: Ran<12>;
}
