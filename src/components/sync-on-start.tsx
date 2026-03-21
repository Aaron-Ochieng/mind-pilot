import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { getLastSyncTimestamp, getLevelsCount } from "@/db/database";
import { syncFirestoreToSQLite } from "@/services/syncService";
import * as Network from "expo-network";

const LEVELS_SYNC_KEY = "levels_sync";

export default function SyncOnStart() {
  const db = useSQLiteContext();

  useEffect(() => {
    const run = async () => {
      try {
        const [lastSync, count, networkState] = await Promise.all([
          getLastSyncTimestamp(db, LEVELS_SYNC_KEY),
          getLevelsCount(db),
          Network.getNetworkStateAsync(),
        ]);

        const isConnected =
          networkState.isConnected && networkState.isInternetReachable;

        if ((lastSync == null || count === 0) && isConnected) {
          console.log("No local levels or sync needed. Syncing from Firestore...");
          await syncFirestoreToSQLite(db);
          return;
        }

        if (!isConnected && count === 0) {
          console.warn("No local levels and no internet connection. Cannot sync.");
          return;
        }

        console.log(
          `Skipping Firestore sync. Local levels: ${count}. Internet: ${isConnected}. Last sync: ${
            lastSync ? new Date(lastSync * 1000).toISOString() : "Never"
          }`,
        );
      } catch (error) {
        console.error("Bootstrap sync failed:", error);
      }
    };

    run();
  }, [db]);

  return null;
}
