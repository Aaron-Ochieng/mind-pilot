import { InstructionIcon } from "@/components/start-instruction-icon";
import WhereToRotate from "@/components/where-to-rotate";
import useInstructionStore from "@/store/loop-game-instructions";
import {
  ChevronRight,
  CornerUpLeft,
  CornerUpRight,
  MoveUp,
  Play,
  Plus,
  SendHorizonal,
  Star,
} from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Feather from "@expo/vector-icons/Feather";

import { calculateBoxSize } from "@/utils/size-calculator";
import { useSQLiteContext } from "expo-sqlite";
import { markLevelAsSolved } from "@/db/database";

const LoopGame = () => {
  const {
    instructionBoard,
    changeInstructionBox,
    currentInsertInstructionBox,
    feedInstruction,
    play,
    planePos,
    rotationDegree,
    gameBoard,
    resetGame,
    currentInstructionIndex,
    won,
    overlapResetCount,
    nextLevel,
    gamePuzzles,
    gamePuzzleIndex,
    markCurrentLevelSolved,
  } = useInstructionStore();

  const db = useSQLiteContext();

  const boxSize = calculateBoxSize(gameBoard![0].length || 12);
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const autoPlayRef = useRef<{
    id: ReturnType<typeof setTimeout> | null;
    active: boolean;
  }>({ id: null, active: false });

  const stopAutoPlay = () => {
    if (autoPlayRef.current.id) {
      clearTimeout(autoPlayRef.current.id);
    }
    autoPlayRef.current.id = null;
    autoPlayRef.current.active = false;
    resetGame();
  };

  const autoPlay = () => {
    if (autoPlayRef.current.active) return;
    autoPlayRef.current.active = true;

    const step = () => {
      if (!autoPlayRef.current.active) return;
      play();
      if (useInstructionStore.getState().won) {
        autoPlayRef.current.active = false;
        autoPlayRef.current.id = null;
        return;
      }
      autoPlayRef.current.id = setTimeout(step, 50);
    };

    step();
  };

  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2500,
        easing: Easing.linear,
      }),
      -1, // infinite
      false,
    );
  }, [rotation]);

  useEffect(() => {
    if (won && gamePuzzles && gamePuzzles[gamePuzzleIndex]) {
      const isAlreadySolved = gamePuzzles[gamePuzzleIndex].solved;

      if (!isAlreadySolved) {
        // Persist win state in SQLite
        markLevelAsSolved(db, gamePuzzles[gamePuzzleIndex].id);
        // Update in-memory state
        markCurrentLevelSolved();
      }

      const timer = setTimeout(() => {
        nextLevel();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [
    won,
    nextLevel,
    gamePuzzles,
    gamePuzzleIndex,
    db,
    markCurrentLevelSolved,
  ]);

  useEffect(() => {
    if (overlapResetCount > 0) stopAutoPlay();
  }, [overlapResetCount]);

  useEffect(() => {
    return () => {
      stopAutoPlay();
    };
  }, []);

  return (
    <View className="bg-slate-900 items-center justify-center w-full h-full">
      <View className="flex-row w-full items-center justify-between px-4 py-6">
        <Pressable
          onPress={() => {
            stopAutoPlay();
            resetGame();
          }}
          className="size-12 rounded-xl border border-gray-500 items-center justify-center"
        >
          <Feather name="trash" size={24} color="#6b7280" />
        </Pressable>
        {won && (
          <Text className="text-emerald-500 font-bold text-xl">You Won</Text>
        )}
        <Text className="text-white font-bold text-2xl">
          {rotationDegree.to} {WhereToRotate(rotationDegree.to)}
        </Text>
      </View>
      <View className="">
        {gameBoard!.map((v, k) => (
          <View key={k} className="flex-row">
            {v.map((v, key) => (
              <View
                key={key}
                style={{ width: boxSize, height: boxSize }}
                className={`m-px rounded-lg items-center justify-center  ${v.c === "indigo" ? "bg-indigo-600" : v.c === "red" ? "bg-red-500" : v.c === "amber" ? "bg-amber-500" : "bg-slate-950"}`}
              >
                {v.iE && !(k === planePos.row && key === planePos.col) ? (
                  <Star
                    size={gameBoard!.length > 12 ? 12 : 16}
                    fill="#000000"
                    strokeOpacity={0}
                    color="#000000"
                  />
                ) : k === planePos.row && key === planePos.col ? (
                  <View className={`${WhereToRotate(rotationDegree.to)}`}>
                    <SendHorizonal
                      color="#ffffff"
                      fill="#ffffff"
                      size={gameBoard!.length > 12 ? 12 : 20}
                    />
                  </View>
                ) : (
                  ""
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
      <View>
        <View className="flex-row flex-wrap gap-2 justify-between mx-4">
          <Pressable
            onPress={() => {
              feedInstruction("NUll", "red", "");
            }}
            className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
          >
            <Plus color="#dc2626" size={35} />
          </Pressable>
          <Pressable
            onPress={() => {
              feedInstruction("NUll", "amber", "");
            }}
            className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
          >
            <Plus color="#fbbf24" size={35} />
          </Pressable>
          <Pressable
            onPress={() => {
              feedInstruction("NUll", "indigo", "");
            }}
            className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
          >
            <Plus color="#4f46e5" size={35} />
          </Pressable>
          <Pressable
            onPress={() => {
              feedInstruction("NUll", "", "red");
            }}
            className="size-12 mt-6 bg-red-500 rounded-lg items-center justify-center"
          ></Pressable>
          <Pressable
            onPress={() => {
              feedInstruction("NUll", "", "amber");
            }}
            className="size-12 mt-6 bg-amber-500 rounded-lg items-center justify-center"
          ></Pressable>
          <Pressable
            onPress={() => {
              feedInstruction("NUll", "", "indigo");
            }}
            className="size-12 mt-6 bg-indigo-500 rounded-lg items-center justify-center"
          ></Pressable>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2 justify-between mx-4">
        <Pressable
          onPress={() => {
            feedInstruction("FORWARD", "", "");
          }}
          className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
        >
          <MoveUp size={20} strokeWidth={4} color="#ffffff" />
        </Pressable>
        <Pressable
          onPress={() => {
            feedInstruction("TURN_LEFT", "", "");
          }}
          className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
        >
          <CornerUpLeft size={20} color="#ffffff" strokeWidth={4} />
        </Pressable>
        <Pressable
          onPress={() => {
            feedInstruction("TURN_RIGHT", "", "");
          }}
          className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
        >
          <CornerUpRight size={20} color="#ffffff" strokeWidth={4} />
        </Pressable>
        <Pressable
          onPress={() => {
            feedInstruction("REPEAT", "", "");
          }}
          className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
        >
          <Text className="text-white font-bold text-xl">0</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            autoPlay();
          }}
          className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
        >
          <Play size={20} color="#ffffff" strokeWidth={2} fill="#fff" />
        </Pressable>
        <Pressable
          onPress={() => {
            play();
          }}
          className="size-12 mt-6 bg-slate-950 rounded-lg items-center justify-center"
        >
          <ChevronRight size={20} color="#ffffff" strokeWidth={3} />
        </Pressable>
      </View>
      <View className="mt-4">
        {instructionBoard?.map((_i, k) => (
          <View key={k} className="flex-row gap-2">
            {_i!.map((v, key) => (
              <Pressable
                key={key}
                onPress={
                  key === 0
                    ? undefined
                    : () => {
                        changeInstructionBox({ row: k, col: key });
                      }
                }
              >
                <View
                  className={`size-12 ${currentInstructionIndex === key && currentInstructionIndex !== 0 ? "border border-pink-600" : ""} ${currentInsertInstructionBox.row === k && currentInsertInstructionBox.col === key ? "border-red-300" : ""} ${instructionBoard[k][key].color === "amber" ? "bg-amber-500" : instructionBoard[k][key].color === "indigo" ? "bg-indigo-500" : instructionBoard[k][key].color === "red" ? "bg-red-500" : "bg-slate-950"} rounded-xl items-center justify-center ${currentInsertInstructionBox.row === k && currentInsertInstructionBox.col === key && instructionBoard[k][key].color === "" ? "border-2 border-slate-500" : ""}`}
                >
                  {InstructionIcon(v)}
                  {instructionBoard[k][key].paintSquare ? (
                    <Plus
                      color={
                        instructionBoard[k][key].paintSquare === "amber"
                          ? "#f59e0b"
                          : instructionBoard[k][key].paintSquare === "red"
                            ? "#ef4444"
                            : instructionBoard[k][key].paintSquare === "indigo"
                              ? "#4f46e5"
                              : "white"
                      }
                      strokeWidth={3}
                    />
                  ) : instructionBoard[k][key].move === "FORWARD" ? (
                    <MoveUp size={20} strokeWidth={4} color="#ffffff" />
                  ) : instructionBoard[k][key].move === "TURN_LEFT" ? (
                    <CornerUpLeft size={20} color="#ffffff" strokeWidth={4} />
                  ) : instructionBoard[k][key].move === "TURN_RIGHT" ? (
                    <CornerUpRight size={20} color="#ffffff" strokeWidth={4} />
                  ) : instructionBoard[k][key].move === "REPEAT" ? (
                    <Text className="text-white font-bold text-xl">0</Text>
                  ) : (
                    ""
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};
export default LoopGame;
