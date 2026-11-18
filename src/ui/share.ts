// 결과 공유 카드 (9:16 PNG). 기기 안에서 그리고 안드로이드 공유 시트로 내보낸다. 서버 없음.

export interface ShareInfo {
  title: string;
  grade: string;
  myLine: string;
  npcLine: string;
  comment: string;
  batteryLeft: number;
  accuracy: number;
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): number {
  let line = '';
  for (const ch of text) {
    const test = line + ch;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y);
      y += lh;
      line = ch;
    } else line = test;
  }
  if (line) g.fillText(line, x, y);
  return y + lh;
}

export function renderCard(info: ShareInfo): HTMLCanvasElement {
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#2b1a5a');
  grad.addColorStop(1, '#ff6b6b');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  g.fillStyle = 'rgba(255,255,255,.95)';
  g.beginPath();
  g.roundRect(80, 260, W - 160, H - 520, 48);
  g.fill();

  g.textAlign = 'center';
  g.fillStyle = '#fff';
  g.font = 'bold 64px sans-serif';
  g.fillText('선택의 연속', W / 2, 170);

  g.fillStyle = '#2b1a5a';
  g.font = 'bold 56px sans-serif';
  g.fillText(info.title, W / 2, 400);

  g.font = 'bold 320px sans-serif';
  g.fillStyle = info.grade === 'F' ? '#999' : '#ff4757';
  g.fillText(info.grade, W / 2, 780);

  g.fillStyle = '#333';
  g.font = '44px sans-serif';
  g.fillText(`나: ${info.myLine}`, W / 2, 900);
  g.fillText(`상대: ${info.npcLine}`, W / 2, 970);

  g.font = 'bold 52px sans-serif';
  g.fillStyle = '#2b1a5a';
  let y = wrap(g, info.comment, W / 2, 1120, W - 280, 72);

  g.font = '44px sans-serif';
  g.fillStyle = '#555';
  y += 30;
  g.fillText(`남은 사회적 배터리 ${info.batteryLeft}%`, W / 2, y);
  g.fillText(`추리 정확도 ${Math.round(info.accuracy * 100)}%`, W / 2, y + 70);

  g.fillStyle = '#fff';
  g.font = '40px sans-serif';
  g.fillText('너도 공략해 볼래?', W / 2, H - 140);
  return c;
}

export async function shareCard(info: ShareInfo): Promise<void> {
  const canvas = renderCard(info);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) return;
  const file = new File([blob], 'seontaek-result.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  try {
    if (nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: '선택의 연속', text: info.comment });
      return;
    }
  } catch {
    /* 공유 취소 등 */
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'seontaek-result.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
