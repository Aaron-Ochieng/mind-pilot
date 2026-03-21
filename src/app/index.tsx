import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { getAllHydratedLevels } from "@/db/database";
import useInstructionStore from "@/store/loop-game-instructions";

const Index = () => {
  const router = useRouter();
  const db = useSQLiteContext();
  const { setGamePuzzles, gamePuzzles, syncStatus } = useInstructionStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLevels = async () => {
      try {
        const res = await getAllHydratedLevels(db);
        setGamePuzzles(res);
      } catch (e) {
        console.error("Failed to load levels:", e);
      } finally {
        setLoading(false);
      }
    };
    void loadLevels();
  }, [db, syncStatus]);

  const hasPuzzles = gamePuzzles && gamePuzzles.length > 0;

  return (
    <View className="w-full h-full items-center justify-center px-8 bg-slate-900 ">
      <SafeAreaView />
      <View className="mb-12 items-center">
        <Text
          className="text-white text-4xl font-bold mb-2"
          style={{ fontFamily: "JetBrainsMono_400Regular" }}
        >
          BlockPilot
        </Text>
        <Text className="text-slate-400 text-center">
          Logic & Memory Challenges
        </Text>
      </View>

      <Pressable
        onPress={() => router.navigate("/memory")}
        className="border w-full border-slate-600 dark:border-gray-slate-500 py-4 items-center justify-center rounded-xl"
      >
        <Text
          className="text-white text-xl"
          style={{ fontFamily: "JetBrainsMono_400Regular" }}
        >
          Memory
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          if (hasPuzzles) {
            router.navigate("/loop");
          }
        }}
        disabled={!hasPuzzles}
        className={`border mt-4 w-full border-slate-600 dark:border-gray-slate-500 py-4 items-center justify-center rounded-xl ${!hasPuzzles ? "opacity-30" : ""}`}
      >
        <Text
          className="text-white text-xl"
          style={{ fontFamily: "JetBrainsMono_400Regular" }}
        >
          Loop
        </Text>
      </Pressable>

      {(!loading || syncStatus !== "idle") && (
        <View
          className={`mt-8 p-4 rounded-lg border w-full ${
            syncStatus === "success"
              ? "bg-emerald-900/20 border-emerald-500/30"
              : syncStatus === "syncing"
                ? "bg-blue-900/20 border-blue-500/30"
                : !hasPuzzles
                  ? "bg-red-900/20 border-red-500/30"
                  : "hidden"
          }`}
        >
          <Text
            className={`text-center text-sm ${
              syncStatus === "success"
                ? "text-emerald-400"
                : syncStatus === "syncing"
                  ? "text-blue-400"
                  : "text-red-400"
            }`}
          >
            {syncStatus === "syncing"
              ? "Syncing puzzles from cloud..."
              : syncStatus === "success"
                ? "Puzzles synchronized successfully!"
                : !hasPuzzles
                  ? "No puzzles found. Please check your internet connection to sync."
                  : ""}
          </Text>
        </View>
      )}

      {loading && syncStatus === "idle" && (
        <View className="mt-8">
          <Text className="text-slate-500 text-sm italic">
            Initializing puzzles...
          </Text>
        </View>
      )}
    </View>
  );
};

export default Index;
