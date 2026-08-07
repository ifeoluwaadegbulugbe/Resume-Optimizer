import { useSyncExternalStore } from "react";
import { useDataStore } from "./store";

/** True once the zustand persist middleware has finished reading localStorage.
 * Use this to gate first render of anything backed by useDataStore, avoiding
 * a server/client markup mismatch — without a setState-in-effect pattern. */
export function useHydrated() {
  return useSyncExternalStore(
    (callback) => useDataStore.persist.onFinishHydration(callback),
    () => useDataStore.persist.hasHydrated(),
    () => false
  );
}
