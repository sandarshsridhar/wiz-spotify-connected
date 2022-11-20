import express, { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { container } from '../../utils/inversify-orchestrator.js';
import { Logger } from '../../utils/logger.js';
import { TYPES } from '../../utils/types.js';
import { emitDanceToSpotifyEvent } from '../emitters/dance-to-spotify-emitter.js';
import { listenToDanceToSpotifyEvent } from '../listeners/dance-to-spotify-listener.js';

const danceToSpotifyRouter = express.Router();
const cacheManager = container.get<NodeCache>(TYPES.CacheManager);
const logger = container.get<Logger>(TYPES.Logger);

danceToSpotifyRouter.get('/dance-to-spotify', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!cacheManager.get('isAuthenticated')) {
      res.redirect('/login');
    } else {
      next();
    }
  } catch (err: any) {
    res.status(500).send('Error occurred');
    logger.error('Error occurred', err.message);
  }
});

danceToSpotifyRouter.get('/dance-to-spotify', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    /*
        This prevents the app from taking no more than one dance request per session.
        It is done to avoid making multiple same requests to Spotify and to the light bulbs.
     */
    const instance = cacheManager.get('instance');
    if (instance === 'running') {
      res.status(200).send('Already running!!!');
    } else {
      next();
    }
  } catch (err: any) {
    cacheManager.set('instance', 'stopped');
    res.status(500).send('Error occurred');
    logger.error('Error occurred', err.message);
  }
});

danceToSpotifyRouter.get('/dance-to-spotify', async (_req: Request, res: Response, next: NextFunction) => {
  cacheManager.set('instance', 'running');
  res.status(200).send('Started Spotify Sync...');
  next();
});

danceToSpotifyRouter.get('/dance-to-spotify', async (req: Request) => {
  try {
    let roomIds = [];
    if (req.query.roomIds) {
      roomIds = (<string>req.query.roomIds).split(',');
    } else {
      roomIds = Object.keys(<never>cacheManager.get('rooms'));
    }

    await listenToDanceToSpotifyEvent();
    await emitDanceToSpotifyEvent(roomIds);

    cacheManager.set('instance', 'stopped');
  } catch (err: any) {
    cacheManager.set('instance', 'stopped');
    logger.error('Error Occurred', err.message);
  }
});

export default danceToSpotifyRouter;
