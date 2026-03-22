import * as SQLite from "expo-sqlite";
import { upsertLevels } from "@/db/database";
import { collection, getDocs } from "firebase/firestore";
import { firestoreDb } from "@/services/firebase";

const LEVELS_COLLECTION = "level";

/**
 * Synchronize levels from Firestore to SQLite.
 * This function fetches all levels from the 'levels' collection in Firestore
 * and stores them in the local SQLite database.
 */
export async function syncFirestoreToSQLite(db: SQLite.SQLiteDatabase) {
  try {
    console.log("Starting sync with Firestore...");

    // 1. Fetch data from Firestore
    const snapshot = await getDocs(collection(firestoreDb, LEVELS_COLLECTION));

    if (snapshot.empty) {
      console.log("No levels found in Firestore.");
      return;
    }

    // 2. Map the Firestore documents to the format expected by SQLite
    const levels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    // Log the pulled data for debugging
    console.log("--- DATA PULLED FROM FIRESTORE ---");
    console.log(JSON.stringify(levels, null, 2));
    console.log("----------------------------------");

    // 3. Upsert into SQLite
    await upsertLevels(db, levels);

    // 4. Update sync metadata
    await db.runAsync(
      "INSERT OR REPLACE INTO sync_meta (key, last_sync_timestamp) VALUES (?, ?)",
      "levels_sync",
      Math.floor(Date.now() / 1000),
    );

    console.log(`Successfully synced ${levels.length} levels.`);
  } catch (error) {
    console.error("Failed to sync Firestore with SQLite:", error);
    throw error;
  }
}
