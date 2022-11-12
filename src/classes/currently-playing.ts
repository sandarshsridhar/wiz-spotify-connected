import { Expose, Transform } from 'class-transformer';

export class CurrentlyPlaying {
  @Expose()
  @Transform(({ obj }) => obj.item.id)
  id: string;

  @Expose({ name: 'is_playing' })
  isPlaying: boolean;

  @Expose({ name: 'progress_ms' })
  progressMs: number;
}
