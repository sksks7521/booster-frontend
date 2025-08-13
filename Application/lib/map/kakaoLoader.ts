export async function loadKakaoSdk(appKey: string): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.kakao?.maps) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-vendor="kakao"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      w.kakao.maps.load(() => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
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
