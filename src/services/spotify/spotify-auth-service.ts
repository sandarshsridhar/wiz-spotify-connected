import { Got, OptionsOfTextResponseBody } from 'got';
import NodeCache from 'node-cache';
import { appConfig } from '../../configs/app-config.js';
import { authConfig } from '../../configs/spotify-config.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { TYPES } from '../../utils/types.js';

export const getAuthToken = async (code?: string) => {
  const httpClient = container.get<Got>(TYPES.HttpClient);
  const cacheManager = container.get<NodeCache>(TYPES.CacheManager);

  let accessToken = cacheManager.get('accessToken');
  if (accessToken) return accessToken;

  let options: OptionsOfTextResponseBody = {
    headers: {
      'Authorization': 'Basic ' + (Buffer.from(authConfig.clientId + ':' + authConfig.clientSecret).toString('base64')),
      'Content-type': 'application/x-www-form-urlencoded'
    }
  };

  let token;

  if (code) {
    options.form = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: appConfig.redirectUri
    };

    token = JSON.parse((await httpClient.post(authConfig.tokenUrl, options)).body);
    cacheManager.set('refreshToken', token.refresh_token);
  } else {
    options.form = {
      grant_type: 'refresh_token',
      refresh_token: cacheManager.get('refreshToken')
    };

    token = JSON.parse((await httpClient.post(authConfig.tokenUrl, options)).body);
  }

  accessToken = token.access_token;

  cacheManager.set('accessToken', accessToken, 59 * 60);

  return accessToken;
};
