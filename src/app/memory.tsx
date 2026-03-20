import Timer from "@/components/timer";
import useMemoryGameStore from "@/store/memory-store";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
export default function Index() {
  const {
    phase,
    changePhase,
    targetGrid,
    userGrid,
    startGame,
    handleCellPress,
    generatePattern,
    score,
    timerKey,
    getCellColor,
  } = useMemoryGameStore();

  // Memorization Timer
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (phase === "MEMORIZE") {
      timeout = setTimeout(() => {
        changePhase("RECALL");
      }, 3000); // 3 seconds to memorize
    }
    return () => clearTimeout(timeout);
  }, [phase, changePhase]);

  return (
    <View className="w-full h-full bg-slate-900 items-center pt-12">
      <View className="h-1/4 w-full items-center justify-center space-y-4">
        {phase === "IDLE" || phase === "GAME_OVER" ? (
          <View className="items-center">
            <Text
              className="text-3xl  text-white mb-4"
              style={{ fontFamily: "JetBrainsMono_400Regular" }}
            >
              {phase === "GAME_OVER" ? "Game Over!" : "Memory Matrix"}
            </Text>
            {phase === "GAME_OVER" && (
              <Text
                className="text-xl text-white mb-4"
                style={{ fontFamily: "JetBrainsMono_400Regular" }}
              >
                Final Score: {score}
              </Text>
            )}
            <Pressable
              onPress={startGame}
              className="bg-blue-600 px-8 py-3 rounded-full"
            >
              <Text
                className="text-white text-lg"
                style={{ fontFamily: "JetBrainsMono_400Regular" }}
              >
                {phase === "IDLE" ? "Start Game" : "Play Again"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Timer
              keyProp={timerKey}
              isPlaying={true}
              onComplete={() => changePhase("GAME_OVER")}
            />
            <Text
              className="text-xl text-white font-semibold mt-2"
              style={{ fontFamily: "JetBrainsMono_400Regular" }}
            >
              {phase === "MEMORIZE" ? "Memorize!" : "Recall!"}
            </Text>
            <Text
              className="text-lg text-gray-300"
              style={{ fontFamily: "JetBrainsMono_400Regular" }}
            >
              Score: {score}
            </Text>
          </>
        )}
      </View>
      <View className="flex-col items-center justify-center mt-2">
        {(phase === "IDLE" || phase === "GAME_OVER"
          ? generatePattern(0)
          : phase === "MEMORIZE" && targetGrid !== null && userGrid !== null
            ? targetGrid
            : userGrid!.length
              ? userGrid!
              : targetGrid!
        ).map((row, r) => (
          <View key={`row-${r}`} className="flex-row">
            {row.map((_, c) => (
              <Pressable
                key={`${r}-${c}`}
                disabled={phase === "MEMORIZE"}
                onPress={() => handleCellPress(r, c)}
                className={`size-12  border-l-[0.5px] border-t-[0.5px] ${(c + 1) % 9 === 0 ? "border-r-[0.5px]" : ""} ${(r + 1) % 9 === 0 ? "border-b-[0.5px]" : ""} border-blue-200 ${getCellColor(
                  r,
                  c,
                )} dark:border-gray-50/30`}
              ></Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
