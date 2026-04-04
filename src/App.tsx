import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CustomizerPage } from "./components/CustomizerPage";
import { OverlayScreen } from "./components/OverlayScreen";
import { resolveDebugMode } from "./lib/overlay-runtime";
import {
  buildCustomizerUrl,
  decodeOverlayStyleConfig,
} from "./lib/overlay-customization";
import {
  clearToken,
  fetchTwitchUserId,
  fetchTwitchUserIdByLogin,
  getStoredToken,
  isTokenExpired,
  pollDeviceCodeToken,
  refreshAccessToken,
  requestDeviceCode,
  storeToken,
  type DeviceCodeResponse,
} from "./lib/twitch-auth";
import { resolveChannel } from "./overlay-utils";

export interface DeviceCodeState {
  userCode: string;
  verificationUri: string;
  expiresAt: number;
}

export function App() {
  const url = useMemo(() => new URL(window.location.href), []);
  const appBaseUrl = useMemo(() => new URL(import.meta.env.BASE_URL, window.location.origin).toString(), []);
  const [twitchAuth, setTwitchAuth] = useState<{
    accessToken: string;
    clientId: string;
    broadcasterId: string;
    userId: string;
  } | null>(null);
  const [deviceCodeState, setDeviceCodeState] = useState<DeviceCodeState | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const pollingAbortRef = useRef<AbortController | null>(null);

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

  const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID as string | undefined;
  const isAuthenticated = twitchAuth !== null || (getStoredToken() !== null && !isTokenExpired(getStoredToken()!));

  // Start Device Code Flow
  const startAuth = useCallback(async () => {
    if (!clientId) return;

    setAuthError(null);

    // Cancel any existing polling
    pollingAbortRef.current?.abort();

    try {
      const dcr: DeviceCodeResponse = await requestDeviceCode(clientId);
      console.log("[Auth] Device code received — enter code:", dcr.user_code, "at", dcr.verification_uri);

      setDeviceCodeState({
        userCode: dcr.user_code,
        verificationUri: dcr.verification_uri,
        expiresAt: Date.now() + dcr.expires_in * 1000,
      });

      const abort = new AbortController();
      pollingAbortRef.current = abort;

      const token = await pollDeviceCodeToken(clientId, dcr.device_code, dcr.interval, abort.signal);

      storeToken(token);
      setDeviceCodeState(null);
      console.log("[Auth] Authenticated successfully — token stored");

      // Trigger token resolution
      resolveAuth();
    } catch (e) {
      setDeviceCodeState(null);
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error("[Auth] Failed:", e instanceof Error ? e.message : e);
      setAuthError(e instanceof Error ? e.message : "Authentication failed");
    }
  }, [clientId]);

  const cancelAuth = useCallback(() => {
    pollingAbortRef.current?.abort();
    setDeviceCodeState(null);
    setAuthError(null);
  }, []);

  const disconnectAuth = useCallback(() => {
    pollingAbortRef.current?.abort();
    clearToken();
    setTwitchAuth(null);
    setDeviceCodeState(null);
    setAuthError(null);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { pollingAbortRef.current?.abort(); };
  }, []);

  // Resolve twitchAuth from stored token
  const resolveAuth = useCallback(async () => {
    // Mock EventSub mode
    if (import.meta.env.VITE_EVENTSUB_URL && !testMode && !customizeMode) {
      setTwitchAuth({
        accessToken: "mock",
        clientId: "mock",
        broadcasterId: "0",
        userId: "0",
      });
      return;
    }

    if (!clientId || !overlayChannel) return;

    let token = getStoredToken();
    if (!token) return;

    if (isTokenExpired(token)) {
      console.log("[Auth] Token expired, refreshing...");
      const refreshed = await refreshAccessToken(clientId, token.refreshToken);
      if (!refreshed) {
        console.log("[Auth] Refresh failed — re-auth required");
        clearToken();
        return;
      }
      storeToken(refreshed);
      token = refreshed;
      console.log("[Auth] Token refreshed");
    }

    const me = await fetchTwitchUserId(token.accessToken, clientId);
    if (!me) return;

    const broadcasterId = await fetchTwitchUserIdByLogin(token.accessToken, clientId, overlayChannel);
    if (!broadcasterId) return;

    console.log("[Auth] Resolved — user:", me.login, "broadcaster:", overlayChannel);
    setTwitchAuth({ accessToken: token.accessToken, clientId, broadcasterId, userId: me.userId });
  }, [clientId, overlayChannel, testMode, customizeMode]);

  useEffect(() => {
    void resolveAuth();
  }, [resolveAuth]);

  if (customizeMode) {
    return (
      <CustomizerPage
        appBaseUrl={appBaseUrl}
        initialConfig={styleConfig}
        isAuthenticated={isAuthenticated}
        deviceCodeState={deviceCodeState}
        authError={authError}
        onConnectTwitch={clientId ? startAuth : undefined}
        onCancelAuth={cancelAuth}
        onDisconnectTwitch={disconnectAuth}
      />
    );
  }

  return (
    <OverlayScreen
      channel={overlayChannel}
      customizeHref={buildCustomizerUrl(appBaseUrl)}
      debugMode={debugMode}
      testMode={testMode}
      styleConfig={styleConfig}
      twitchAuth={twitchAuth}
      isAuthenticated={isAuthenticated}
      deviceCodeState={deviceCodeState}
      onConnectTwitch={clientId ? startAuth : undefined}
      onCancelAuth={cancelAuth}
    />
  );
}
