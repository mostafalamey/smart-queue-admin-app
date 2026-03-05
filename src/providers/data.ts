import { createSimpleRestDataProvider } from "@refinedev/rest/simple-rest";
import { API_URL } from "./constants";
import { clearTokens, getAccessToken, silentRefresh } from "@/lib/api-client";

export const { dataProvider, kyInstance } = createSimpleRestDataProvider({
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
