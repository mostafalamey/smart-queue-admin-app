import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/providers/constants";
import { getAccessToken, silentRefresh } from "./api-client";

/**
 * Socket.IO client singleton for the Smart Queue realtime gateway.
 *
 * Authentication uses the `auth.token` handshake option (JWT access token).
 * On UNAUTHORIZED errors, attempts a silent token refresh and reconnects.
 *
 * Events received:
 *   - `queue.updated`        — any queue mutation for subscribed service
 *   - `now-serving.updated`  — ticket called/served/completed for subscribed service/station
 *   - `authorization.error`  — room subscription denied
 *
 * Room subscriptions (client → server):
 *   - `subscribe.service`  (serviceId: string)
 *   - `subscribe.station`  (stationId: string)
 */

export interface QueueRealtimeEvent {
  requestId: string;
  operation: string;
  ticketId?: string;
  serviceId?: string;
  stationId?: string;
  occurredAt: string;
}

let socket: Socket | null = null;
let reconnectAttempt = 0;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(API_URL, {
    path: "/realtime/socket.io",
    auth: { token: getAccessToken() ?? "" },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30_000,
  });

  socket.on("connect", () => {
    reconnectAttempt = 0;
  });

  socket.on("connect_error", async (err) => {
    // If the error is auth-related, try refreshing the token
    if (
      err.message === "UNAUTHORIZED" ||
      err.message === "FORBIDDEN" ||
      err.message?.includes("jwt") ||
      err.message?.includes("token")
    ) {
      try {
        const result = await silentRefresh();
        if (result && socket) {
          // Update the auth token for the next reconnection attempt
          socket.auth = { token: result.auth.accessToken };
        }
      } catch {
        // silentRefresh failed — socket will keep retrying with reconnection backoff
      }
    }
    reconnectAttempt++;
  });

  return socket;
}

/**
 * Connect the socket if authenticated and not already connected.
 * Safe to call multiple times — no-op if already connected.
 */
export function connectSocket(): void {
  const token = getAccessToken();
  if (!token) return;

  const s = getSocket();
  s.auth = { token };
  if (!s.connected) {
    s.connect();
  }
}

/**
 * Disconnect and destroy the socket. Called on logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    reconnectAttempt = 0;
  }
}

/**
 * Subscribe to a service room. The server will send `queue.updated` and
 * `now-serving.updated` events for tickets in this service.
 */
export function subscribeService(serviceId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit("subscribe.service", serviceId);
  }
}

/**
 * Subscribe to a station room. Receives `now-serving.updated` for that counter.
 */
export function subscribeStation(stationId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit("subscribe.station", stationId);
  }
}
