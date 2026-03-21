import { useEffect, useMemo, useState } from "react";
import { CustomizerPage } from "./components/CustomizerPage";
import { OverlayScreen, resolveDebugMode } from "./components/OverlayScreen";
import {
  buildCustomizerUrl,
  decodeOverlayStyleConfig,
} from "./lib/overlay-customization";
import {
  clearOAuthState,
  clearVerifier,
  exchangeCodeForToken,
  getStoredOAuthState,
  getStoredVerifier,
  storeToken,
} from "./lib/twitch-auth";
import { resolveChannel } from "./overlay-utils";

export function App() {
  const url = useMemo(() => new URL(window.location.href), []);
  const appBaseUrl = useMemo(() => new URL(import.meta.env.BASE_URL, window.location.origin).toString(), []);
  const [oauthProcessing, setOauthProcessing] = useState(false);

  const customizeMode = url.searchParams.get("customize") === "1";
  const testMode = url.searchParams.get("test") === "1";
  const debugMode = resolveDebugMode();
  const overlayChannel = resolveChannel(
    url.searchParams.get("channel"),
    import.meta.env.VITE_CHANNEL_NAME ?? null,
  );
  const styleConfig = useMemo(
    () => decodeOverlayStyleConfig(url.searchParams.get("cfg")),
    [url],
  );

  useEffect(() => {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return;

    const storedState = getStoredOAuthState();
    if (state !== storedState) {
      clearVerifier();
      clearOAuthState();
      return;
    }

    const verifier = getStoredVerifier();
    if (!verifier) {
      clearOAuthState();
      return;
    }

    const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID;
    if (!clientId) {
      clearVerifier();
      clearOAuthState();
      return;
    }

    const redirectUri = new URL(appBaseUrl);
    redirectUri.search = "";
    redirectUri.searchParams.set("customize", "1");

    setOauthProcessing(true);

    exchangeCodeForToken({
      clientId,
      code,
      redirectUri: redirectUri.toString(),
      codeVerifier: verifier,
    })
      .then((token) => {
        storeToken(token);
        clearVerifier();
        clearOAuthState();

        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("code");
        cleanUrl.searchParams.delete("state");
        cleanUrl.searchParams.set("customize", "1");
        window.location.replace(cleanUrl.toString());
      })
      .catch(() => {
        clearVerifier();
        clearOAuthState();
        setOauthProcessing(false);
      });
  }, [url, appBaseUrl]);

  if (oauthProcessing) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p>認証処理中...</p>
      </div>
    );
  }

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
