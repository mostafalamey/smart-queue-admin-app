import { API_URL } from "@/providers/constants";

// ─── Token storage (in-memory for access, localStorage for refresh) ─────────
//
// TODO(security): Refresh tokens should be stored in HttpOnly Secure SameSite
// cookies set by the backend.  This requires server-side changes to POST
// /auth/login, /auth/refresh, and /auth/logout to use Set-Cookie headers
// instead of returning the token in the JSON body.  Until then, localStorage
// is used as a **dev-only** convenience.  Do NOT ship this to an internet-
// facing production environment without migrating to cookie-based flow.
//
let accessToken: string | null = null;

const REFRESH_TOKEN_KEY = "sq_refresh_token";

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: "ADMIN" | "IT" | "MANAGER" | "STAFF";
  departmentId?: string;
  mustChangePassword: boolean;
}

export interface AuthTokens {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
}

export interface LoginResponse {
  user: AuthUser;
  auth: AuthTokens;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
}

// ─── Core fetch wrapper ─────────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<LoginResponse | null> | null = null;

async function refreshTokens(): Promise<LoginResponse | null> {
  const rt = getRefreshToken();
  if (!rt) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data: LoginResponse = await res.json();
  setAccessToken(data.auth.accessToken);
  setRefreshToken(data.auth.refreshToken);
  return data;
}

/**
 * Mutex-protected silent refresh. Shared by apiFetch and the ky afterResponse hook
 * so concurrent 401s coalesce into a single refresh call.
 */
export async function silentRefresh(): Promise<LoginResponse | null> {
  if (!getRefreshToken()) return null;

  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshTokens().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/**
 * Authenticated fetch wrapper.
 * Automatically attaches Bearer token and retries once on 401 via token refresh.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  const headers = new Headers(init?.headers);
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("Content-Type") && init?.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...init, headers });

  // On 401, attempt a single token refresh and retry
  if (res.status === 401) {
    try {
      const refreshResult = await silentRefresh();
      if (refreshResult) {
        headers.set("Authorization", `Bearer ${refreshResult.auth.accessToken}`);
        res = await fetch(url, { ...init, headers });
      }
    } catch {
      // Refresh failed (network error, 5xx, etc.) — clear stale tokens and
      // fall through to return the original 401 response.
      clearTokens();
    }
  }

  return res;
}

/**
 * Typed JSON fetch — throws ApiError on non-2xx responses.
 */
export async function apiJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await apiFetch(path, init);

  if (!res.ok) {
    let error: ApiError;
    try {
      error = await res.json();
    } catch {
      error = {
        statusCode: res.status,
        code: "UNKNOWN",
        message: res.statusText,
      };
    }
    throw error;
  }

  return res.json();
}
