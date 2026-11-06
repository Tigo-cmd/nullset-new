// Presenter unlock: the teacher-view tools stay hidden unless this browser
// opened the page with ?present in the URL. Once it has, the choice is
// remembered on this device. Read through an external store so the static
// (server) render is always "locked" and the client reconciles after mount,
// avoiding a hydration mismatch.

import { useSyncExternalStore } from "react";

let resolved: boolean | null = null;

function compute(): boolean {
  try {
    return new URL(window.location.href).searchParams.has("present");
  } catch {
    return false;
  }
}

const presenterStore = {
  subscribe() {
    return () => {};
  },
  getSnapshot(): boolean {
    if (resolved === null) resolved = compute();
    return resolved;
  },
  getServerSnapshot(): boolean {
    return false;
  },
};

export function usePresenter(): boolean {
  return useSyncExternalStore(presenterStore.subscribe, presenterStore.getSnapshot, presenterStore.getServerSnapshot);
}
