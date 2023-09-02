import { Expose } from 'class-transformer';
export class AudioFeatures {
  @Expose()
  id: string;

  @Expose()
  danceability: number;

  @Expose()
  energy: number;

  @Expose()
  tempo: number;
}
