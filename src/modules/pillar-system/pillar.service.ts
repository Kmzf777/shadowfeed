import type { PillarConfig, PillarDisplayConfig, PillarId } from '../../shared/types/pillar.types.js';
import { PILLAR_CONFIGS, ALL_PILLAR_IDS } from './pillar-configs.js';

export function getPillarConfig(pillarId?: PillarId | null): PillarConfig {
  if (pillarId && PILLAR_CONFIGS[pillarId]) {
    return PILLAR_CONFIGS[pillarId];
  }
  return PILLAR_CONFIGS.educate;
}

export function getAllPillarDisplayConfigs(): PillarDisplayConfig[] {
  return ALL_PILLAR_IDS.map((id) => {
    const config = PILLAR_CONFIGS[id];
    return {
      id: config.id,
      name: config.name,
      description: config.description,
      icon: config.icon,
      slideRange: config.slideRange,
      ctaStyle: config.ctaStyle,
    };
  });
}
