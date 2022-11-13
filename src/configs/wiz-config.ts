import * as dotenv from 'dotenv';

dotenv.config();

export const wizConfig = {
  routerIpRange: process.env.ROUTER_IP_RANGE || '10.0.0.255',
  wizListenerPort: 38899
};
