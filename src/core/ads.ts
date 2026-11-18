// 보상형 광고 추상화. 수익 모델은 보상형 광고만 사용한다 (인앱결제·꾸미기 없음).
// 프로토타입은 MockRewardedAds로 흐름만 확인하고, 안드로이드 빌드에서는 AdMob 플러그인
// (예: @capacitor-community/admob 의 prepareRewardVideoAd / showRewardVideoAd)을 같은 인터페이스로 감싸 교체한다.
//
// 원칙: 광고는 언제나 선택 사항이다. 오프라인이거나 광고가 없으면 버튼을 숨기고, 게임 진행은 막지 않는다.

export type AdReason = 'retry_minigame' | 'battery_refill' | 'notebook_hint';

export interface RewardedAds {
  isAvailable(): boolean;
  /** 끝까지 시청하면 true */
  show(reason: AdReason): Promise<boolean>;
}

export const AD_LABEL: Record<AdReason, string> = {
  retry_minigame: '아이스 아메리카노 수혈하고 다시 도전',
  battery_refill: '잠깐 쉬고 배터리 +30',
  notebook_hint: '추리 힌트 1개 보기',
};

export class MockRewardedAds implements RewardedAds {
  isAvailable(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  }

  show(reason: AdReason): Promise<boolean> {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'ad-overlay';
      let left = 3;
      el.innerHTML = `<div class="ad-box"><div class="ad-tag">광고 (테스트)</div>
        <div class="ad-title">${AD_LABEL[reason]}</div>
        <div class="ad-count">${left}</div>
        <div class="ad-note">실제 앱에서는 여기서 보상형 광고가 재생됩니다.</div></div>`;
      document.body.appendChild(el);
      const timer = setInterval(() => {
        left -= 1;
        const c = el.querySelector('.ad-count');
        if (c) c.textContent = String(left);
        if (left <= 0) {
          clearInterval(timer);
          el.remove();
          resolve(true);
        }
      }, 1000);
    });
  }
}

export const ads: RewardedAds = new MockRewardedAds();
