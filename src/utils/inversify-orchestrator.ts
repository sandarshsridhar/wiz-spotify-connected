import { Got } from 'got';
import { Container } from 'inversify';
import NodeCache from 'node-cache';
import * as dgram from 'node:dgram';
import { Socket } from 'node:dgram';
import { EventEmitter } from 'node:events';
import { createHttpClient } from './http-client.js';
import { TYPES } from './types.js';

const createContainer = (enableDebugMode = false): Container => {
  const container = new Container();

  container.bind<NodeCache>(TYPES.CacheManager).toConstantValue(new NodeCache({
    stdTTL: 24 * 60 * 60,
    deleteOnExpire: true
  }));
  container.bind<Got>(TYPES.HttpClient).toConstantValue(createHttpClient(enableDebugMode));
  container.bind<Socket>(TYPES.Socket).toDynamicValue(() => dgram.createSocket('udp4'));
  container.bind<EventEmitter>(TYPES.EventBus).toConstantValue(new EventEmitter());

  return container;
};

export const container = createContainer();
