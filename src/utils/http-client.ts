import { got } from 'got';
import { Agent as HttpsAgent } from 'https';
import { gotConfig } from '../configs/got-config.js';

const options = {
  keepAlive: true,
  timeout: (60 * 1000) - 5000
};

export const createHttpClient = (debug = false) => {
  return got.extend({
    agent: {
      https: new HttpsAgent(options)
    },
    timeout: { request: gotConfig.requestTimeOutMs },
    retry: {
      limit: gotConfig.retryLimit,
      calculateDelay: ({ computedValue }) => {
        return Math.min(gotConfig.retryMaxDelayMs, computedValue);
      },
      methods: ['POST', 'GET', 'PUT']
    },
    hooks: {
      beforeRequest: [
        (request) => {
          if (debug)
            console.info(`Request to: ${request.url}`, {
              jsonBody: request.json,
              body: request.body,
              headers: request.headers
            });
        }
      ],

      afterResponse: [
        (response) => {
          if (debug)
            console.info(`Response from: ${response.requestUrl}`, {
              statusCode: response.statusCode,
              body: response.body,
              retryCount: response.retryCount,
              timings: response.timings.phases.total,
              socket: `${response?.request?.socket?.localAddress}:${response?.request?.socket?.localPort}`
            });

          return response;
        }
      ]
    }
  });
};
