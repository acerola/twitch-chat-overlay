const TOKEN_STORAGE_KEY = "twitch_overlay_token";
const VERIFIER_STORAGE_KEY = "twitch_pkce_verifier";
const STATE_STORAGE_KEY = "twitch_oauth_state";
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export interface TwitchToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string[];
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

/** Returns a 128-character URL-safe random string for use as a PKCE code verifier. */
export function generateCodeVerifier(): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = crypto.getRandomValues(new Uint8Array(128));
  let verifier = "";
  for (const byte of randomValues) {
    verifier += charset[byte % charset.length];
  }
  return verifier;
}

/** SHA-256 hash of the verifier, base64url-encoded (no padding). */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---------------------------------------------------------------------------
// Auth URL building
// ---------------------------------------------------------------------------

export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): string {
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user:read:chat");
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", params.state);
  return url.toString();
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

export async function exchangeCodeForToken(params: {
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TwitchToken> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    code: params.code,
    grant_type: "authorization_code",
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? [],
  };
}

export async function refreshAccessToken(params: {
  clientId: string;
  refreshToken: string;
}): Promise<TwitchToken> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
  });

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope ?? [],
  };
}

// ---------------------------------------------------------------------------
// Token storage (localStorage — shared across tabs on same origin)
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
  return Date.now() + EXPIRY_BUFFER_MS >= token.expiresAt;
}

// ---------------------------------------------------------------------------
// PKCE state storage (sessionStorage — per-tab, cleared on close)
// ---------------------------------------------------------------------------

export function storeVerifier(verifier: string): void {
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
}

export function getStoredVerifier(): string | null {
  return sessionStorage.getItem(VERIFIER_STORAGE_KEY);
}

export function clearVerifier(): void {
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
}

export function storeOAuthState(state: string): void {
  sessionStorage.setItem(STATE_STORAGE_KEY, state);
}

export function getStoredOAuthState(): string | null {
  return sessionStorage.getItem(STATE_STORAGE_KEY);
}

export function clearOAuthState(): void {
  sessionStorage.removeItem(STATE_STORAGE_KEY);
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
