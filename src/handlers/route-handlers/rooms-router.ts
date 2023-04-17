import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { Bulb } from '../../classes/type-definitions.js';
import { setRoom } from '../../services/wiz/lights-service.js';
import { container } from '../../utils/inversify-orchestrator.js';
import { Logger } from '../../utils/logger.js';
import { TYPES } from '../../utils/types.js';

const roomsRouter = express.Router();
const cacheManager = container.get<NodeCache>(TYPES.CacheManager);
const logger = container.get<Logger>(TYPES.Logger);

roomsRouter.get('/rooms', async (_req: Request, res: Response) => {
  try {
    res.header('Content-type', 'application/json').status(200).send(JSON.stringify(cacheManager.get('rooms'), null, 1));
  } catch (err: any) {
    res.status(500).send('Error occurred');
    logger.error('Error occurred', err.message);
  }
});

roomsRouter.post('/rooms/:roomId', async (req: Request, res: Response) => {
  try {
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

    res.status(200).header('Content-type', 'application/json').send(JSON.stringify(config));
  } catch (err: any) {
    res.status(500).send('Error occurred');
    logger.error('Error occurred', err.message);
  }
});

export default roomsRouter;
