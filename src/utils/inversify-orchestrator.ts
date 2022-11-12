import { Got } from 'got';
import { Container } from 'inversify';
import NodeCache from 'node-cache';
import * as dgram from 'node:dgram';
import { Socket } from 'node:dgram';
import { EventEmitter } from 'node:events';
import { createHttpClient } from './http-client.js';
import { TYPES } from './types.js';

export const createContainer = (enableDebugMode = false): Container => {
  const container = new Container();

  container.bind<NodeCache>(TYPES.CacheManager).toConstantValue(new NodeCache({
    deleteOnExpire: true
  }));
  container.bind<Got>(TYPES.HttpClient).toConstantValue(createHttpClient(enableDebugMode));
  container.bind<Socket>(TYPES.Socket).toDynamicValue(() => dgram.createSocket('udp4'));
  container.bind<EventEmitter>(TYPES.EventBus).toConstantValue(new EventEmitter());

  return container;
};
