import { Router } from 'express';
import { getAllPillarDisplayConfigs } from './pillar.service.js';

const router = Router();

router.get('/', (_req, res) => {
  const pillars = getAllPillarDisplayConfigs();
  res.json(pillars);
});

export default router;
