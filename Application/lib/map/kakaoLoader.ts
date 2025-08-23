export async function loadKakaoSdk(appKey: string): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as any;
  // clusterer 라이브러리까지 로드된 경우에만 조기 반환
  if (w.kakao?.maps && w.kakao.maps.MarkerClusterer) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-vendor="kakao"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      const hasClusterer = existing.src.includes("libraries=clusterer");
      if (!hasClusterer) {
        // clusterer 미포함으로 로드된 스크립트인 경우 교체
        existing.remove();
      } else {
        // 스크립트 태그는 이미 존재하고 clusterer도 포함 → 로드 완료 대기 후 resolve
        if (w.kakao?.maps) {
          try {
            w.kakao.maps.load(() => resolve());
          } catch {
            // load 호출 시점 레이스 대비하여 load 이벤트로 보조 처리
            existing.addEventListener(
              "load",
              () => w.kakao.maps.load(() => resolve()),
              { once: true }
            );
          }
        } else {
          existing.addEventListener(
            "load",
            () => w.kakao.maps.load(() => resolve()),
            { once: true }
          );
        }
        return;
      }
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-vendor", "kakao");
    script.onload = () => {
      w.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("Kakao SDK load failed"));
    document.head.appendChild(script);
  });
}
