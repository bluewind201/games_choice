// 고도(Godot) 판에 넣을 지도 그림·장면 배경·게임 데이터를 브라우저에서 뽑아낸다 (scripts/godot-export.mjs가 실행).
import { renderMap, buildColliders, buildGrid, BUILDINGS, TREES, LAMPS, BENCHES, MAP_W, MAP_H, U, doorOf } from '../src/world/map';
import * as D from '../src/world/data';
import { drawScene } from '../src/ui/scene';
import { MISSIONS } from '../src/data/missions';
import { QUIZ, PERSONAS } from '../src/data/onboarding';
import { DIM_DEFS } from '../src/core/notebook';
import { DIMS_BY_LEVEL } from '../src/data/stages';
import { ZODIAC_KR, SIGNS, GEN_LABEL, ELEMENT_LABEL } from '../src/core/profile';

declare global {
  interface Window {
    __EXPORT: () => Record<string, unknown>;
  }
}

window.__EXPORT = () => {
  const map = renderMap();
  const scenes: Record<string, string> = {};
  for (const kind of ['office', 'pasta', 'park'] as const)
    for (const [tag, clock] of [['day', 12 * 60], ['dusk', 18 * 60], ['night', 20 * 60 + 30]] as const) {
      const c = document.createElement('canvas');
      drawScene(c, kind, clock);
      scenes[`${kind}_${tag}`] = c.toDataURL('image/png');
    }
  const grid = buildGrid();
  return {
    mapPng: map.toDataURL('image/png'),
    scenes,
    world: {
      U, MAP_W, MAP_H,
      grid: Array.from(grid),
      colliders: buildColliders(),
      buildings: BUILDINGS.map((b) => ({ ...b, door: doorOf(b) })),
      trees: TREES, lamps: LAMPS, benches: BENCHES,
    },
    data: {
      npcs: D.NPCS, encounters: D.ENCOUNTERS, shop: D.SHOP, rewardItems: D.REWARD_ITEMS,
      missionReward: D.MISSION_REWARD, levelTitle: D.LEVEL_TITLE, cats: D.CATS, wallet: D.WALLET_POS, bed: D.BED_POS,
      bus: D.BUS_STOPS, busFare: D.BUS_FARE, subway: D.SUBWAY, subwayFare: D.SUBWAY_FARE, bikes: D.BIKE_RACKS, bikeFare: D.BIKE_FARE,
      missions: MISSIONS, quiz: QUIZ, personas: PERSONAS, dims: DIM_DEFS, dimsByLevel: DIMS_BY_LEVEL,
      zodiacKr: ZODIAC_KR, signs: SIGNS, genLabel: GEN_LABEL, elementLabel: ELEMENT_LABEL,
    },
  };
};
