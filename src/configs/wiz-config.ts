export const wizConfig = {
  routerIpRange: process.env.ROUTER_IP_RANGE || '10.0.0.255',
  wizListenerPort: Number.parseInt(process.env.WIZ_LISTENER_PORT || '38899')
};
