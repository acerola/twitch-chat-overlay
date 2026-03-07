import { startTransition, useEffect, useMemo, useState } from "react";
import { CustomizerPage } from "./components/CustomizerPage";
import { OverlayScreen, resolveDebugMode } from "./components/OverlayScreen";
import {
  buildCustomizerUrl,
  decodeOverlayStyleConfig,
  readOverlayPreviewStyleSyncMessage,
} from "./lib/overlay-customization";
import { normalizeChannel } from "./overlay-utils";

export function App() {
  const url = useMemo(() => new URL(window.location.href), []);
  const appBaseUrl = useMemo(() => new URL(import.meta.env.BASE_URL, window.location.origin).toString(), []);

  const customizeMode = url.searchParams.get("customize") === "1";
  const testMode = url.searchParams.get("test") === "1";
  const debugMode = resolveDebugMode();
  const overlayChannel = normalizeChannel(import.meta.env.VITE_CHANNEL_NAME ?? null);
  const initialStyleConfig = useMemo(
    () => decodeOverlayStyleConfig(url.searchParams.get("cfg")),
    [url],
  );
  const [styleConfig, setStyleConfig] = useState(() => initialStyleConfig);

  useEffect(() => {
    if (!testMode) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const nextStyleConfig = readOverlayPreviewStyleSyncMessage(event.data);
      if (!nextStyleConfig) {
        return;
      }

      startTransition(() => {
        setStyleConfig(nextStyleConfig);
      });
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [testMode]);

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
