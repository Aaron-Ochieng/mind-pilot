import { Memory } from "@/loops/initial";
import { create } from "zustand";

export type GamePhase = "IDLE" | "MEMORIZE" | "RECALL" | "GAME_OVER";

type MemoryState = {
  phase: GamePhase;
  targetGrid: Memory[][] | null;
  userGrid: Memory[][] | null;
  score: number | 0;
  timerKey: number | 0;
  rows: number | 9;
  cols: number | 9;
  active_cells: number | 5;
  generatePattern: (numActive: number) => Memory[][];
  startGame: () => void;
  startRound: () => void;
  getCellColor: (row: number, column: number) => string;
  changePhase: (phase: GamePhase) => void;
  handleCellPress: (row: number, column: number) => void;
};

const useMemoryGameStore = create<MemoryState>()((set, get) => ({
  phase: "IDLE",
  targetGrid: null,
  userGrid: null,
  score: 0,
  timerKey: 0,
  rows: 9,
  cols: 9,
  active_cells: 5,
  generatePattern: (numActive) => {
    const { rows, cols } = get();
    const grid: Memory[][] = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({ selected: false })),
      );

    let placed = 0;
    while (placed < numActive) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      if (!grid[r][c].selected) {
        grid[r][c].selected = true;
        placed++;
      }
    }

    return grid;
  },

  startGame: () => {
    const { startRound } = get();
    const { timerKey } = get();
    set({ timerKey: timerKey + 1, score: 0 }); // Reset score
    startRound();
  },

  startRound: () => {
    const { rows, cols, active_cells, score, generatePattern } = get();
    const newPattern = generatePattern(active_cells + Math.floor(score / 5)); // Increase difficulty every 5 points

    set({
      targetGrid: newPattern,
      userGrid: Array(rows)
        .fill(null)
        .map(() =>
          Array(cols)
            .fill(null)
            .map(() => ({ selected: false })),
        ),
      phase: "MEMORIZE",
    });
  },
  getCellColor: (r, c) => {
    const { phase, targetGrid, userGrid } = get();
    if (phase === "MEMORIZE" && userGrid !== null && targetGrid !== null) {
      return targetGrid![r][c].selected ? "bg-blue-500" : "bg-transparent";
    } else if (phase === "RECALL") {
      if (userGrid![r][c].selected) {
        return targetGrid![r][c].selected ? "bg-green-500" : "bg-red-500";
      }
      return "bg-transparent";
    }
    return "bg-transparent"; // IDLE or GAME_OVER
  },
  changePhase: (phase: GamePhase) => set({ phase: phase }),
  handleCellPress: (rowIndex, colIndex) => {
    const { phase, targetGrid, userGrid, rows, cols, score } = get();
    if (phase !== "RECALL" && targetGrid === null && userGrid === null) return;

    const isTarget = targetGrid![rowIndex][colIndex].selected;
    const isAlreadySelected = userGrid![rowIndex][colIndex].selected;

    if (isAlreadySelected) return;

    if (isTarget) {
      const newUserGrid = [...userGrid!];
      newUserGrid[rowIndex][colIndex] = { selected: true }; // Mark as found
      set({ userGrid: newUserGrid });

      // Check for round completion
      let correctCount = 0;
      let totalTargets = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (targetGrid![r][c].selected) totalTargets++;
          if (targetGrid![r][c].selected && newUserGrid[r][c].selected)
            correctCount++;
        }
      }

      if (correctCount === totalTargets) {
        set({ score: score + 1 });
        setTimeout(() => get().startRound(), 500);
      }
    } else {
      // Briefly show red then reset
      const newUserGrid = [...userGrid!];
      newUserGrid[rowIndex][colIndex] = { selected: true }; // Mark as selected (wrong)
      set({ userGrid: newUserGrid });
      setTimeout(() => get().startRound(), 500); // Brief delay to realize mistake
    }
  },
}));

export default useMemoryGameStore;
