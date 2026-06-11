// Seasonal color drift — returns a suggested accent color based on time of year
// Southern hemisphere aware (NZ/AU): seasons are inverted

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const SEASON_COLORS: Record<Season, { color: string; name: string; description: string }> = {
  spring: { color: '#7EC8A4', name: 'Spring Green',  description: 'New growth. Opening.' },
  summer: { color: '#F5A623', name: 'Summer Gold',   description: 'Full brightness. Expansion.' },
  autumn: { color: '#C07A3A', name: 'Autumn Amber',  description: 'Harvest. Integration.' },
  winter: { color: '#4A9EFF', name: 'Winter Blue',   description: 'Depth. The long study.' },
};

export function getCurrentSeason(southernHemisphere = false): Season {
  const month = new Date().getMonth(); // 0–11
  let season: Season;
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'autumn';
  else season = 'winter';

  if (southernHemisphere) {
    const flip: Record<Season, Season> = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' };
    return flip[season];
  }
  return season;
}

export function getSeasonalColor(southernHemisphere = false) {
  return SEASON_COLORS[getCurrentSeason(southernHemisphere)];
}

export { SEASON_COLORS };
