const TOKEN_STORAGE_KEY = "twitch_overlay_token";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TwitchToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string[];
}

export interface DeviceCodeResponse {
  device_code: string;
  expires_in: number;
  interval: number;
  user_code: string;
  verification_uri: string;
}

// ---------------------------------------------------------------------------
// Device Code Grant Flow
// ---------------------------------------------------------------------------

export async function requestDeviceCode(
  clientId: string,
): Promise<DeviceCodeResponse> {
  const body = new URLSearchParams({
    client_id: clientId,
    scopes: "user:read:chat",
  });

  const response = await fetch("https://id.twitch.tv/oauth2/device", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Device code request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function pollDeviceCodeToken(
  clientId: string,
  deviceCode: string,
  interval: number,
  signal: AbortSignal,
): Promise<TwitchToken> {
  let pollInterval = interval;

  while (!signal.aborted) {
    await new Promise<void>((resolve, reject) => {
      const id = setTimeout(resolve, pollInterval * 1000);
      signal.addEventListener("abort", () => { clearTimeout(id); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
    });

    const body = new URLSearchParams({
      client_id: clientId,
      scopes: "user:read:chat",
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        scope: data.scope ?? [],
      };
    }

    const errorData = await response.json().catch(() => ({ message: "" }));
    const message = errorData.message ?? "";

    if (message === "authorization_pending") {
      continue;
    }
    if (message === "slow_down") {
      pollInterval += 5;
      continue;
    }
    // expired_token, access_denied, or unknown error
    throw new Error(message || `Polling failed (${response.status})`);
  }

  throw new DOMException("Aborted", "AbortError");
}

// ---------------------------------------------------------------------------
// Token refresh (works without client_secret for public apps)
// ---------------------------------------------------------------------------

export async function refreshAccessToken(
  clientId: string,
  refreshToken: string,
): Promise<TwitchToken | null> {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body,
  });

  if (!response.ok) return null;

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? [],
  };
}

// ---------------------------------------------------------------------------
// Token storage (localStorage)
// ---------------------------------------------------------------------------

export function storeToken(token: TwitchToken): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
}

export function getStoredToken(): TwitchToken | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TwitchToken;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isTokenExpired(token: TwitchToken): boolean {
  const EXPIRY_BUFFER_MS = 5 * 60 * 1000;
  return Date.now() + EXPIRY_BUFFER_MS >= token.expiresAt;
}

// ---------------------------------------------------------------------------
// User ID fetching
// ---------------------------------------------------------------------------

export async function fetchTwitchUserId(
  accessToken: string,
  clientId: string,
): Promise<{ userId: string; login: string } | null> {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": clientId,
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const user = data.data?.[0];
  if (!user) return null;

  return { userId: user.id, login: user.login };
}

export async function fetchTwitchUserIdByLogin(
  accessToken: string,
  clientId: string,
  login: string,
): Promise<string | null> {
  const url = new URL("https://api.twitch.tv/helix/users");
  url.searchParams.set("login", login);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": clientId,
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const user = data.data?.[0];
  return user?.id ?? null;
}
