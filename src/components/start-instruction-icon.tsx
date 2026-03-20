import { Instruction } from "@/store/loop-game-instructions";
import { Text } from "react-native";

export function InstructionIcon(instruction: Instruction) {
  if (instruction.startCode !== null) {
    if (instruction.startCode === 0) {
      return <Text className="text-white text-xl font-bold">0</Text>;
    }

    if (instruction.startCode === 1) {
      return <Text className="text-white text-xl font-bold">1</Text>;
    }
    if (instruction.startCode === 2) {
      return <Text className="text-white text-xl font-bold">2</Text>;
    }
  }
}
