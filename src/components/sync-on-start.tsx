import { useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { getLastSyncTimestamp, getLevelsCount } from "@/db/database";
import { syncFirestoreToSQLite } from "@/services/syncService";
import * as Network from "expo-network";
import useInstructionStore from "@/store/loop-game-instructions";

const LEVELS_SYNC_KEY = "levels_sync";

export default function SyncOnStart() {
  const db = useSQLiteContext();
  const [retryCount, setRetryCount] = useState(0);
  const syncInProgress = useRef(false);
  const { setSyncStatus } = useInstructionStore();

  useEffect(() => {
    const run = async () => {
      if (syncInProgress.current) return;

      try {
        const [lastSync, count, networkState] = await Promise.all([
          getLastSyncTimestamp(db, LEVELS_SYNC_KEY),
          getLevelsCount(db),
          Network.getNetworkStateAsync(),
        ]);

        const isConnected =
          networkState.isConnected && networkState.isInternetReachable;

        // If we have levels, we don't strictly NEED to sync immediately for the app to function
        if (count > 0) {
          console.log(`Local levels found: ${count}. Skipping urgent sync.`);
          return;
        }

        if (isConnected) {
          syncInProgress.current = true;
          setSyncStatus("syncing");
          console.log("No local levels. Syncing from Firestore...");
          await syncFirestoreToSQLite(db);
          setSyncStatus("success");
          syncInProgress.current = false;
          
          // Reset status to idle after showing success for a bit
          setTimeout(() => setSyncStatus("idle"), 3000);
        } else {
          setSyncStatus("error");
          console.warn(
            `No local levels and offline. Retrying in 2s... (Attempt ${
              retryCount + 1
            })`,
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        }
      } catch (error) {
        setSyncStatus("error");
        console.error("Bootstrap sync failed:", error);
        syncInProgress.current = false;
        // Retry on error too
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 5000);
      }
    };

    run();
  }, [db, retryCount]);

  return null;
}
