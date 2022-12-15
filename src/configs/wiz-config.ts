import * as dotenv from 'dotenv';

dotenv.config();

export const wizConfig = {
  broadcastAddress: process.env.BROADCAST_ADDRESS || '255.255.255.255',
  wizListenerPort: 38899,
  discoveryTimeout: 16000,
  discoveryTries: 15
};
