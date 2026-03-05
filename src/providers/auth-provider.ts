import type { AuthProvider } from "@refinedev/core";
import { API_URL } from "./constants";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  type ApiError,
  type LoginResponse,
} from "@/lib/api-client";
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "@/lib/stored-user";

/** Allowed roles for the admin app (Staff cannot access admin). */
const ADMIN_APP_ROLES = ["ADMIN", "IT", "MANAGER"] as const;

export const authProvider: AuthProvider = {
  // ── LOGIN ─────────────────────────────────────────────────────────────────
  login: async ({ email, password }) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err: ApiError = await res.json().catch(() => ({
          statusCode: res.status,
          code: "UNKNOWN",
          message: res.statusText,
        }));

        // Map known error codes to user-friendly messages
        const messages: Record<string, string> = {
          INVALID_CREDENTIALS: "Invalid email or password.",
          ACCOUNT_LOCKED:
            "Account locked due to too many failed attempts. Try again in 15 minutes.",
          TOO_MANY_REQUESTS: "Too many login attempts. Please wait and try again.",
          ROLE_SELECTION_REQUIRED:
            "Multiple roles detected. Contact your administrator.",
        };

        return {
          success: false,
          error: {
            name: err.code,
            message: messages[err.code] ?? err.message,
          },
        };
      }

      const data: LoginResponse = await res.json();

      // Block Staff from admin app
      if (!ADMIN_APP_ROLES.includes(data.user.role as (typeof ADMIN_APP_ROLES)[number])) {
        return {
          success: false,
          error: {
            name: "FORBIDDEN",
            message: "Staff accounts cannot access the admin app.",
          },
        };
      }

      // Persist tokens and user
      setAccessToken(data.auth.accessToken);
      setRefreshToken(data.auth.refreshToken);
      setStoredUser(data.user);

      // If the user must change password, redirect to change-password page
      if (data.user.mustChangePassword) {
        return {
          success: true,
          redirectTo: "/change-password",
        };
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (err) {
      console.error("[auth-provider] login error:", err);
      return {
        success: false,
        error: {
          name: "NETWORK_ERROR",
          message: "Cannot reach the server. Check your connection.",
        },
      };
    }
  },

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  logout: async () => {
    const refreshToken = getRefreshToken();

    // Best-effort server-side logout
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore network errors on logout
      }
    }

    clearTokens();
    clearStoredUser();

    return {
      success: true,
      redirectTo: "/login",
    };
  },

  // ── CHECK ─────────────────────────────────────────────────────────────────
  check: async () => {
    const token = getAccessToken();
    const user = getStoredUser();

    if (token && user) {
      // Verify stored user still has an allowed role
      if (!ADMIN_APP_ROLES.includes(user.role as (typeof ADMIN_APP_ROLES)[number])) {
        clearTokens();
        clearStoredUser();
        return {
          authenticated: false,
          redirectTo: "/login",
          error: { name: "FORBIDDEN", message: "Staff accounts cannot access the admin app." },
        };
      }
      return { authenticated: true };
    }

    // Try to silently refresh if we have a refresh token
    const rt = getRefreshToken();
    if (rt) {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });

        if (res.ok) {
          const data: LoginResponse = await res.json();

          // Block disallowed roles even after a successful refresh
          if (!ADMIN_APP_ROLES.includes(data.user.role as (typeof ADMIN_APP_ROLES)[number])) {
            clearTokens();
            clearStoredUser();
            return {
              authenticated: false,
              redirectTo: "/login",
              error: { name: "FORBIDDEN", message: "Staff accounts cannot access the admin app." },
            };
          }

          setAccessToken(data.auth.accessToken);
          setRefreshToken(data.auth.refreshToken);
          setStoredUser(data.user);
          return { authenticated: true };
        }
      } catch {
        // Fall through to unauthenticated
      }
    }

    clearTokens();
    clearStoredUser();

    return {
      authenticated: false,
      redirectTo: "/login",
      error: {
        name: "UNAUTHENTICATED",
        message: "Session expired. Please sign in again.",
      },
    };
  },

  // ── GET IDENTITY ──────────────────────────────────────────────────────────
  getIdentity: async () => {
    const user = getStoredUser();
    if (!user) return null;

    return {
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
    };
  },

  // ── ON ERROR ──────────────────────────────────────────────────────────────
  onError: async (error) => {
    const status = error?.statusCode ?? error?.status;

    if (status === 401) {
      return {
        logout: true,
        redirectTo: "/login",
        error: {
          name: "UNAUTHENTICATED",
          message: "Session expired.",
        },
      };
    }

    if (status === 403) {
      return {
        error: {
          name: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
        },
      };
    }

    return {};
  },

  // ── GET PERMISSIONS ───────────────────────────────────────────────────────
  getPermissions: async () => {
    const user = getStoredUser();
    return user?.role ?? null;
  },
};
