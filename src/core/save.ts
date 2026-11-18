// 기기 안 저장소(localStorage). 서버 없음. Capacitor 앱에서도 WebView 저장소로 유지되고,
// 안드로이드 자동 백업으로 기기 변경 시 복원할 수 있다.
import type { Profile } from './profile';
import type { Grade } from './rules';
import type { WorldSave } from '../world/world';

export interface SaveData {
  version: 1;
  realProfile?: Profile;
  personaId?: string; // 'REAL' 또는 PERSONAS id
  best: Record<string, Grade>;
  battery: number;
  /** 3D 동네 진행 상황 */
  world?: WorldSave;
}

const KEY = 'seontaek.save.v1';

export function emptySave(): SaveData {
  return { version: 1, best: {}, battery: 100 };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1) return emptySave();
    return { ...emptySave(), ...data };
  } catch {
    return emptySave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 저장이 막힌 환경(시크릿 모드 등)에서도 게임은 계속된다.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
