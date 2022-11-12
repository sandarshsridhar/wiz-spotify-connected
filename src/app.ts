import express, { Express, Request, Response } from 'express';
import NodeCache from 'node-cache';
import queryString from 'query-string';
import { appConfig } from './configs/app-config.js';
import { authConfig } from './configs/spotify-config.js';
import { emitDanceToSpotifyEvent } from './handlers/emitters/dance-to-spotify-emitter.js';
import { listenToDanceToSpotifyEvent } from './handlers/listeners/dance-to-spotify-listener.js';
import { getAuthToken } from './services/spotify/spotify-auth-service.js';
import { Bulb, getRooms, setRoom } from './services/wiz/lights-service.js';
import { createContainer } from './utils/inversify-orchestrator.js';
import { TYPES } from './utils/types.js';

export const container = createContainer();

const app: Express = express();
const state = 'spotify-wiz-connected';
const scope = 'user-read-currently-playing user-read-playback-state';
const cacheManager = container.get<NodeCache>(TYPES.CacheManager);

app.get('/api/login', (_req: Request, res: Response) => {
  const qString = queryString.stringify({
    response_type: 'code',
    client_id: authConfig.clientId,
    scope: scope,
    redirect_uri: appConfig.redirectUri,
    state: state
  });

  res.redirect(`${authConfig.authUrl}?${qString}`);
});

app.get('/api/callback', async (req: Request, res: Response) => {
  if (req.query.state !== state) {
    res.send('State does not match!');
  } else {
    await getAuthToken(<string>req.query.code);
    cacheManager.set('isAuthenticated', true);
    res.send('Logged in!');
  }
});

app.get('/api/rooms', async (_req: Request, res: Response) => {
  res.header('Content-type', 'application/json').send(cacheManager.get('rooms'));
});

app.post('/api/rooms/:roomId', async (req: Request, res: Response) => {
  const config: Bulb = {
    state: req.query.state === 'true',
    color: {
      red: Number.parseInt(<string>req.query.red),
      green: Number.parseInt(<string>req.query.green),
      blue: Number.parseInt(<string>req.query.blue)
    },
    brightness: Number.parseFloat(<string>req.query.brightness),
    coldWhite: Number.parseFloat(<string>req.query.coldWhite),
    warmWhite: Number.parseFloat(<string>req.query.warmWhite),
    temp: Number.parseFloat(<string>req.query.temp)
  };

  await setRoom(req.params.roomId, config);
  res.header('Content-type', 'application/json').send(JSON.stringify(config));
});

app.get('/api/dance-to-spotify', async (req, res) => {
  if (!cacheManager.get('isAuthenticated')) {
    res.redirect('/api/login');
  } else {
    const instance = cacheManager.get('instance');
    if (instance === 'running') {
      res.send('Already running!!!');
    } else {
      cacheManager.set('instance', 'running');

      res.send('Started Spotify Sync...');

      let roomIds = [];
      if (req.query.roomIds) {
        roomIds = (<string>req.query.roomIds).split(',');
      } else {
        roomIds = Object.keys(<never>cacheManager.get('rooms'));
      }

      await listenToDanceToSpotifyEvent();
      await emitDanceToSpotifyEvent(roomIds);

      cacheManager.set('instance', 'stopped');
    }
  }
});

app.listen(appConfig.port, async () => {
  cacheManager.set('rooms', await getRooms());
  console.log(`⚡️[server]: Server is running at https://localhost:${appConfig.port}`);
});
