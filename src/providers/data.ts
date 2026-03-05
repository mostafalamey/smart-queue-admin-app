import { createSimpleRestDataProvider } from "@refinedev/rest/simple-rest";
import type { DataProvider } from "@refinedev/core";
import { API_URL } from "./constants";
import { clearTokens, getAccessToken, silentRefresh } from "@/lib/api-client";
import { getStoredUser } from "@/lib/stored-user";

const { dataProvider: baseProvider, kyInstance } = createSimpleRestDataProvider({
  apiURL: API_URL,
  kyOptions: {
    hooks: {
      beforeRequest: [
        (request) => {
          const token = getAccessToken();
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        },
      ],
      afterResponse: [
        async (request, _options, response) => {
          if (response.status !== 401) return response;

          try {
            const refreshResult = await silentRefresh();
            if (!refreshResult) return response;

            // Retry the original request with the fresh token
            request.headers.set(
              "Authorization",
              `Bearer ${refreshResult.auth.accessToken}`
            );
            return fetch(request);
          } catch {
            // Refresh failed (network error, 5xx, etc.) — clear stale tokens
            // and return the original 401 so Refine's onError handles it.
            clearTokens();
            return response;
          }
        },
      ],
    },
  },
});

export { kyInstance };

/**
 * Wraps the base data provider to auto-inject the manager's departmentId
 * as a permanent filter on getList. For non-MANAGER users the wrapper is
 * a transparent pass-through. Server-side guards remain authoritative.
 */
function withManagerScope(provider: DataProvider): DataProvider {
  return {
    ...provider,

    getList: (params) => {
      const user = getStoredUser();
      if (user?.role === "MANAGER") {
        if (!user.departmentId) {
          return Promise.reject(
            new Error("MANAGER user has no departmentId — cannot fetch unscoped data."),
          );
        }
        const deptFilter = {
          field: "departmentId",
          operator: "eq" as const,
          value: user.departmentId,
        };
        return provider.getList({
          ...params,
          filters: [...(params.filters ?? []), deptFilter],
        });
      }
      return provider.getList(params);
    },
  };
}

export const dataProvider = withManagerScope(baseProvider);
