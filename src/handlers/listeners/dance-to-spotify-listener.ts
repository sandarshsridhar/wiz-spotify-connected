import { EventEmitter } from 'node:events';
import { container } from '../../../app.js';
import { Bulb, setRoom } from '../../services/wiz/lights-service.js';
import { ColorSpace } from '../../utils/color-picker.js';
import { TYPES } from '../../utils/types.js';

export type Lights = {
  delayMs: number;
  colorSpace: ColorSpace,
  brightness: number;
}

export const listenToDanceToSpotifyEvent = async () => {
  const eventBus = container.get<EventEmitter>(TYPES.EventBus);

  eventBus.on('changeLights', async (roomIds: Array<string>, brightness: number, colorSpace: ColorSpace) => {
    const bulb: Bulb = {
      state: true,
      brightness
    };

    const promises: Array<Promise<void>> = [];

    roomIds.forEach(roomId => promises.push(setRoom(roomId, bulb, colorSpace)));

    await Promise.all(promises);
  });
};
