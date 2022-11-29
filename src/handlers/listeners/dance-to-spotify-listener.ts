import { EventEmitter } from 'node:events';
import { Bulb, ColorSpace } from '../../classes/type-definitions.js';
import { setRoom } from '../../services/wiz/lights-service.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { TYPES } from '../../utils/types.js';

export const listenToDanceToSpotifyEvent = async (roomIds: Array<string>) => {
  const eventBus = container.get<EventEmitter>(TYPES.EventBus);

  eventBus.on('changeLights', async (brightness: number, colorSpace: ColorSpace) => {
    const bulb: Bulb = {
      state: true,
      brightness
    };

    const promises = roomIds.map(roomId => setRoom(roomId, bulb, colorSpace));

    return Promise.all(promises);
  });
};
