import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  subscribeService,
  type QueueRealtimeEvent,
} from "@/lib/socket";

/* ── Context ─────────────────────────────────────────────────────────────── */

interface SocketContextValue {
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ connected: false });

export function useSocketStatus() {
  return useContext(SocketContext);
}

/* ── Provider — manages connect/disconnect lifecycle ─────────────────────── */

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    connectSocket();

    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // If already connected (e.g. fast re-render), sync state
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ connected }}>
      {children}
    </SocketContext.Provider>
  );
}

/* ── useServiceSubscription — subscribe to a service room and listen ─────── */

/**
 * Subscribes to realtime events for a specific service. Calls `onUpdate`
 * whenever a `queue.updated` or `now-serving.updated` event is received
 * for that service.
 *
 * Handles:
 * - Subscribing on connect (and re-subscribing after reconnect)
 * - Cleaning up listeners on unmount or serviceId change
 */
export function useServiceSubscription(
  serviceId: string | null,
  onUpdate: (event: QueueRealtimeEvent) => void,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!serviceId) return;

    const socket = getSocket();

    const handleQueueUpdated = (event: QueueRealtimeEvent) => {
      // Only react to events for our subscribed service
      if (!event.serviceId || event.serviceId === serviceId) {
        onUpdateRef.current(event);
      }
    };

    const handleNowServing = (event: QueueRealtimeEvent) => {
      if (!event.serviceId || event.serviceId === serviceId) {
        onUpdateRef.current(event);
      }
    };

    const subscribe = () => {
      subscribeService(serviceId);
    };

    // Subscribe immediately if connected
    if (socket.connected) {
      subscribe();
    }

    // Re-subscribe after reconnect
    socket.on("connect", subscribe);
    socket.on("queue.updated", handleQueueUpdated);
    socket.on("now-serving.updated", handleNowServing);

    return () => {
      socket.off("connect", subscribe);
      socket.off("queue.updated", handleQueueUpdated);
      socket.off("now-serving.updated", handleNowServing);
    };
  }, [serviceId]);
}

/* ── useQueueEvent — generic listener for any socket event ───────────────── */

export function useQueueEvent(
  eventName: string,
  handler: (event: QueueRealtimeEvent) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const wrapper = (event: QueueRealtimeEvent) => handlerRef.current(event);
    socket.on(eventName, wrapper);
    return () => {
      socket.off(eventName, wrapper);
    };
  }, [eventName]);
}
