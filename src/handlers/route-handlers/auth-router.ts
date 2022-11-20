import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import queryString from 'query-string';
import { appConfig } from '../../configs/app-config.js';
import { authConfig } from '../../configs/spotify-config.js';
import { getAuthToken } from '../../services/spotify/spotify-auth-service.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { TYPES } from '../../utils/types.js';

const authRouter = express.Router();
const cacheManager = container.get<NodeCache>(TYPES.CacheManager);

authRouter.get('/login', (_req: Request, res: Response) => {
  const state = 'spotify-wiz-connected';
  const scope = 'user-read-currently-playing user-read-playback-state';
  const qString = queryString.stringify({
    response_type: 'code',
    client_id: authConfig.clientId,
    scope: scope,
    redirect_uri: appConfig.redirectUri,
    state: state
  });

  res.redirect(`${authConfig.authUrl}?${qString}`);
});

authRouter.get('/callback', async (req: Request, res: Response) => {
  const state = 'spotify-wiz-connected';
  if (req.query.state !== state) {
    res.send('State does not match!');
  } else {
    await getAuthToken(<string>req.query.code);
    cacheManager.set('isAuthenticated', true);
    res.send('Logged in!');
  }
});

export default authRouter;
