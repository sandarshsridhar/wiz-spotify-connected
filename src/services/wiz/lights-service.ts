import NodeCache from 'node-cache';
import { Socket } from 'node:dgram';
import { nextTick } from 'process';
import { Bulb, Color, ColorSpace } from '../../classes/type-definitions.js';
import { wizConfig } from '../../configs/wiz-config.js';
import { calculateColors } from '../../utils/color-picker.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { Logger } from '../../utils/logger.js';
import { TYPES } from '../../utils/types.js';

export const getRooms = async (): Promise<Record<string, any>> => {
  const socket = container.get<Socket>(TYPES.Socket);
  const logger = container.get<Logger>(TYPES.Logger);

  const promise = new Promise<Map<string, Map<string, string>>>((resolve) => {
    const bulbs = new Map<string, Map<string, string>>();
    socket.bind(() => {
      socket.setBroadcast(true);
      const registerMessage = '{"method":"registration","params":{"phoneMac":"AAAAAAAAAAAA","register":true,"phoneIp":"1.2.3.4","id":"1"}}';
      const message = '{ "method": "getSystemConfig", "params": {} }';

      sendMessage(registerMessage, socket, wizConfig.broadcastAddress, 5, 100);
      sendMessage(message, socket, wizConfig.broadcastAddress, 5, 1000);

      socket.on('message', (msg, rinfo) => {
        const parsedMessage = JSON.parse(msg.toString('utf-8'));

        logger.debug(parsedMessage, rinfo);

        if (parsedMessage?.method === 'getSystemConfig') {
          const current = bulbs.get(parsedMessage.result.roomId) ?? new Map();

          current.set(rinfo.address, parsedMessage.result.mac);
          bulbs.set(parsedMessage.result.roomId, current);
        }
      });
    });

    setTimeout(() => {
      resolve(bulbs);
      socket.close();
    }, 7000);
  });

  return buildRoomData(await promise);
};

export const setRoom = async (roomId: string, config: Bulb, colorSpace?: ColorSpace) => {
  const cacheManager = container.get<NodeCache>(TYPES.CacheManager);
  const bulbs: Array<[string, string]> = (<Record<string, any>>cacheManager.get('rooms'))[roomId];
  const socket = container.get<Socket>(TYPES.Socket);

  await new Promise<void>((resolve) => {
    socket.bind(() => {
      // socket.setBroadcast(true);
      let message: string;
      let colors: Array<Color>;

      if (!colorSpace) {
        message = buildCustomBulbMessage(config);
      } else {
        colors = calculateColors(colorSpace, bulbs.length);
      }

      bulbs.forEach((bulb, index) => {
        if (colorSpace) {
          config.color = colors[index];
          message = buildStandardBulbMessage(config);
        }
        sendMessage(message, socket, bulb[0]);
      });
    });

    setTimeout(() => {
      resolve();
      socket.close();
    }, 100);
  });
};

const buildCustomBulbMessage = (config: Bulb) => {
  return JSON.stringify({
    method: 'setPilot',
    params: {
      state: config.state,
      ...(config.temp && { temp: config.temp }),
      ...(config.brightness && { dimming: config.brightness }),
      ...(config.coldWhite && !config.warmWhite && { c: config.coldWhite }),
      ...(config.warmWhite && !config.coldWhite && { w: config.warmWhite }),
      ...(config.color && { r: config.color.red, g: config.color.green, b: config.color.blue })
    }
  });
};

const buildStandardBulbMessage = (config: Bulb) => {
  return JSON.stringify({
    method: 'setPilot',
    params: {
      state: config.state,
      dimming: config.brightness,
      ...(config.color && { r: config.color.red, g: config.color.green, b: config.color.blue })
    }
  });
};

const sendMessage = (message: string, socket: Socket, ip: string, maxTries?: number, delay?: number) => {
  const logger = container.get<Logger>(TYPES.Logger);

  if (!maxTries) {
    logger.debug(message, ip);
    nextTick(() => socket.send(message, wizConfig.wizListenerPort, ip));
  } else {
    let counter = 1;
    const interval = setInterval(() => {
      if (counter > maxTries) {
        clearInterval(interval);
        return;
      }

      socket.send(message, wizConfig.wizListenerPort, ip);
      counter++;
    }, delay);
  }
};

const buildRoomData = (rawData: Map<string, Map<string, string>>) => {
  const rooms = {};

  for (let [roomId, bulbs] of (rawData).entries()) {
    Object.assign(rooms, { [roomId]: [...bulbs] });
  }

  return rooms;
};
