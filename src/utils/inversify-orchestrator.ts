import { Got } from 'got';
import { Container } from 'inversify';
import NodeCache from 'node-cache';
import * as dgram from 'node:dgram';
import { Socket } from 'node:dgram';
import { EventEmitter } from 'node:events';
import { LogOutput } from '../classes/type-definitions.js';
import { FileWriter } from './file-writer.js';
import { createHttpClient } from './http-client.js';
import { Logger } from './logger.js';
import { TYPES } from './types.js';

const createContainer = (): Container => {
  const container = new Container();

  container.bind<NodeCache>(TYPES.CacheManager).toConstantValue(new NodeCache({
    stdTTL: 24 * 60 * 60,
    deleteOnExpire: true
  }));

  const enableDebugMode = process.argv.some(arg => arg === 'debug');
  const logOutput = process.argv.some(arg => arg === 'file') ? LogOutput.file : LogOutput.console;
  const logger = new Logger(enableDebugMode, logOutput, new FileWriter());

  container.bind<Logger>(TYPES.Logger).toConstantValue(logger);
  container.bind<Got>(TYPES.HttpClient).toConstantValue(createHttpClient(logger));
  container.bind<Socket>(TYPES.Socket).toDynamicValue(() => dgram.createSocket('udp4'));
  container.bind<EventEmitter>(TYPES.EventBus).toConstantValue(new EventEmitter());

  return container;
};

export const container = createContainer();
