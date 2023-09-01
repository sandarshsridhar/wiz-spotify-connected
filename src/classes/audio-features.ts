import { Expose } from 'class-transformer';
export class AudioFeatures {
  @Expose()
  danceability: number;

  @Expose()
  energy: number;

  @Expose()
  valence: number;
}
