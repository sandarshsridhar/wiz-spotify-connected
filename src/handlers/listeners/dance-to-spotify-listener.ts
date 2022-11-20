import { EventEmitter } from 'node:events';
import { Bulb, ColorSpace } from '../../classes/type-definitions.js';
import { setRoom } from '../../services/wiz/lights-service.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { TYPES } from '../../utils/types.js';

export const listenToDanceToSpotifyEvent = async () => {
  const eventBus = container.get<EventEmitter>(TYPES.EventBus);

  eventBus.on('changeLights', async (roomIds: Array<string>, brightness: number, colorSpace: ColorSpace) => {
    const bulb: Bulb = {
      state: true,
      brightness
    };

    const promises = roomIds.map(roomId => setRoom(roomId, bulb, colorSpace));

    await Promise.all(promises);
  });
};
