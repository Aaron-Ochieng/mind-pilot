import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { getLastSyncTimestamp, getLevelsCount } from "@/db/database";
import { syncFirestoreToSQLite } from "@/services/syncService";

const LEVELS_SYNC_KEY = "levels_sync";

export default function SyncOnStart() {
  const db = useSQLiteContext();

  useEffect(() => {
    const run = async () => {
      try {
        const [lastSync, count] = await Promise.all([
          getLastSyncTimestamp(db, LEVELS_SYNC_KEY),
          getLevelsCount(db),
        ]);

        if (lastSync == null || count === 0) {
          console.log("No local levels yet. Syncing from Firestore...");
          await syncFirestoreToSQLite(db);
          return;
        }

        console.log(
          `Skipping Firestore sync. Local levels: ${count}. Last sync: ${new Date(
            lastSync * 1000,
          ).toISOString()}`,
        );
      } catch (error) {
        console.error("Bootstrap sync failed:", error);
      }
    };

    run();
  }, [db]);

  return null;
}
