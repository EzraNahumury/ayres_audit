// Shared WhatsApp socket state via globalThis
const KEY = "__ayres_wa_state__";

export interface WAState {
  qr: string | null;
  status: "waiting" | "connected" | "disconnected";
  socket: any;
  store: any;
  connecting: boolean;
  initialized: boolean;
}

// Singleton — always return same object
if (!(globalThis as any)[KEY]) {
  (globalThis as any)[KEY] = {
    qr: null,
    status: "disconnected",
    socket: null,
    store: null,
    connecting: false,
    initialized: false,
  } as WAState;
}

export function getWaState(): WAState {
  return (globalThis as any)[KEY];
}

export const waState = getWaState();
