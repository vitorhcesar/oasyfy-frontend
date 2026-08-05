export type TPwaInstallPlatform = "ios" | "android" | "desktop";

export type TPwaInstallContext = {
  platform: TPwaInstallPlatform;
  isStandalone: boolean;
  isIosSafari: boolean;
  isIosNonSafari: boolean;
};

const DEFAULT_CONTEXT: TPwaInstallContext = {
  platform: "desktop",
  isStandalone: false,
  isIosSafari: false,
  isIosNonSafari: false,
};

function isIosDevice(ua: string, platform: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPod/.test(ua)) return true;
  if (/iPad/.test(ua)) return true;
  // iPadOS 13+ may report as Macintosh with touch
  if (platform === "MacIntel" && maxTouchPoints > 1) return true;
  return false;
}

function isIosSafari(ua: string): boolean {
  const isSafari =
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/i.test(ua);
  return isSafari;
}

/**
 * Detecta plataforma e se o app já roda em modo standalone (PWA instalada).
 * Seguro para chamar só no client.
 */
export function detectPwaInstallContext(
  win: Window = window,
): TPwaInstallContext {
  try {
    const nav = win.navigator;
    const ua = nav.userAgent || "";
    const platform = nav.platform || "";
    const maxTouchPoints = nav.maxTouchPoints || 0;

    const ios = isIosDevice(ua, platform, maxTouchPoints);
    const android = /Android/i.test(ua);
    const detectedPlatform: TPwaInstallPlatform = ios
      ? "ios"
      : android
        ? "android"
        : "desktop";

    const displayStandalone = win.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone =
      "standalone" in nav &&
      Boolean((nav as Navigator & { standalone?: boolean }).standalone);
    const isStandalone = displayStandalone || iosStandalone;

    const iosSafari = ios && isIosSafari(ua);
    const iosNonSafari = ios && !iosSafari;

    return {
      platform: detectedPlatform,
      isStandalone,
      isIosSafari: iosSafari,
      isIosNonSafari: iosNonSafari,
    };
  } catch {
    return DEFAULT_CONTEXT;
  }
}

export function getDefaultPwaInstallContext(): TPwaInstallContext {
  return DEFAULT_CONTEXT;
}
