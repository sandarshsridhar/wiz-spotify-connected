import { Expose, Transform } from 'class-transformer';

export type Ran<T extends number> = number extends T ? number : _Range<T, []>;
type _Range<T extends number, R extends unknown[]> = R['length'] extends T ? R[number] : _Range<T, [R['length'], ...R]>;

export class AudioAnalysis {
  @Expose()
  sections: Array<Section>;
}

class Section {
  @Expose()
  start: number;

  @Expose()
  @Transform(({ obj }) => obj.start + obj.duration)
  end: number;

  @Expose()
  loudness: number;

  @Expose()
  tempo: number;

  @Expose()
  key: Ran<12>;
}
