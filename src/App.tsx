import { useMemo } from "react";
import { CustomizerPage } from "./components/CustomizerPage";
import { OverlayScreen, resolveDebugMode } from "./components/OverlayScreen";
import {
  buildCustomizerUrl,
  decodeOverlayStyleConfig,
} from "./lib/overlay-customization";
import { normalizeChannel } from "./overlay-utils";

export function App() {
  const url = useMemo(() => new URL(window.location.href), []);
  const appBaseUrl = useMemo(() => new URL(import.meta.env.BASE_URL, window.location.origin).toString(), []);

  const customizeMode = url.searchParams.get("customize") === "1";
  const testMode = url.searchParams.get("test") === "1";
  const debugMode = resolveDebugMode();
  const overlayChannel = normalizeChannel(import.meta.env.VITE_CHANNEL_NAME ?? null);
  const styleConfig = useMemo(
    () => decodeOverlayStyleConfig(url.searchParams.get("cfg")),
    [url],
  );

  if (customizeMode) {
    return <CustomizerPage appBaseUrl={appBaseUrl} initialConfig={styleConfig} />;
  }

  return (
    <OverlayScreen
      channel={overlayChannel}
      customizeHref={buildCustomizerUrl(appBaseUrl)}
      debugMode={debugMode}
      testMode={testMode}
      styleConfig={styleConfig}
    />
  );
}
