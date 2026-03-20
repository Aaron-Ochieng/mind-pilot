import { Loop } from "@/loops/gameLoop";
import { create } from "zustand";
import { rotationDegree as rt } from "@/utils/rotation";
import { HydratedLevel } from "@/db/schema";

export type MOVE = "FORWARD" | "TURN_RIGHT" | "TURN_LEFT" | "REPEAT" | "NUll";
export type COLORS = "red" | "amber" | "indigo" | "";
export type Instruction = {
  move: MOVE;
  colorSquare: boolean;
  color: COLORS;
  paintSquare: COLORS;
  isStart: boolean;
  startCode: number | null;
};
export type coordinates = {
  row: number;
  col: number;
};

export interface Rotate {
  from: number;
  to: number;
}
type InstructionsState = {
  gamePuzzles: HydratedLevel[] | null;
  gamePuzzleIndex: number;
  setGamePuzzles: (gamePuzzles: HydratedLevel[]) => void;
  won: boolean;
  canPlay: boolean;
  overlapResetCount: number;
  rotationDegree: Rotate;
  startPos: coordinates | null;
  endPos: coordinates | null;
  planePos: coordinates;
  gameBoard: Loop[][] | null;
  _gameBoardCopy: Loop[][] | null;
  userBoard: Loop[][] | null;
  coloredSquares: Set<string>;
  visitedColoredSquares: Set<string>;
  instructions: Instruction[] | null;
  instructionBoard: Instruction[][] | null;
  currentInsertInstructionBox: coordinates;
  changeInstructionBox: (coordinate: coordinates) => void;
  feedInstruction: (move: MOVE, paint: COLORS, color: COLORS) => void;
  _moveForward: () => void;
  _changeGridColor: (c: COLORS) => void;
  _copyGameBoard: () => void;
  play: () => void;
  currentInstructionIndex: number;
  resetGame: () => void;
  _planeOverlaps: () => void;
};

const findStart = (board: Loop[][]): { startPos: coordinates } => {
  let startPos: coordinates | null = null;

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell.iS && !startPos) startPos = { row, col };
    }
  }

  const fallbackStart: coordinates = { row: 0, col: 0 };

  return {
    startPos: startPos ?? fallbackStart,
  };
};

const posKey = (pos: coordinates) => `${pos.row}:${pos.col}`;

const collectColoredSquares = (board: Loop[][]): Set<string> => {
  const colored = new Set<string>();
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].c !== "") {
        colored.add(`${row}:${col}`);
      }
    }
  }
  return colored;
};

const initVisitedSquares = (
  startPos: coordinates | null,
  coloredSquares: Set<string>,
): Set<string> => {
  const visited = new Set<string>();
  if (startPos) {
    const key = posKey(startPos);
    if (coloredSquares.has(key)) {
      visited.add(key);
    }
  }
  return visited;
};

const hasVisitedAllColoredSquares = (
  visited: Set<string>,
  coloredSquares: Set<string>,
): boolean => coloredSquares.size > 0 && visited.size >= coloredSquares.size;

const getInstructionStartIndex = (
  instructionBoard: Instruction[][] | null,
): number => {
  if (!instructionBoard || instructionBoard.length === 0) return 0;
  if (!instructionBoard[0] || instructionBoard[0].length === 0) return 0;
  return instructionBoard[0].length > 1 ? 1 : 0;
};

const useInstructionStore = create<InstructionsState>()((set, get) => ({
  gamePuzzles: null,
  gamePuzzleIndex: 0,

  setGamePuzzles: (gamePuzzle) => {
    let gameIndex: number = 0;
    gamePuzzle.map((k, idx) => {
      if (!k.solved) {
        gameIndex = idx;
      }
    });
    const firstPuzzle = gamePuzzle[gameIndex];
    const { startPos } = findStart(gamePuzzle[gameIndex].gameLoop);
    const coloredSquares = collectColoredSquares(
      gamePuzzle[gameIndex].gameLoop,
    );
    const visitedColoredSquares = initVisitedSquares(startPos, coloredSquares);
    const startInstructionIndex = getInstructionStartIndex(
      firstPuzzle ? firstPuzzle.instructions : null,
    );
    set({
      gamePuzzles: gamePuzzle,
      instructionBoard: firstPuzzle ? firstPuzzle.instructions : null,
      gameBoard: gamePuzzle[gameIndex].gameLoop,
      startPos: startPos,
      planePos: startPos,
      rotationDegree: gamePuzzle[gameIndex].rotationDegree,
      coloredSquares,
      visitedColoredSquares,
      won: hasVisitedAllColoredSquares(visitedColoredSquares, coloredSquares),
      currentInstructionIndex: startInstructionIndex,
      gamePuzzleIndex: gameIndex,
    });
  },
  won: false,
  canPlay: true,
  overlapResetCount: 0,
  currentInstructionIndex: 0,
  rotationDegree: { from: 0, to: 0 },
  startPos: null,
  endPos: null,
  planePos: { row: 0, col: 0 },
  gameBoard: null,
  _gameBoardCopy: null,
  _copyGameBoard: () => {
    set({ _gameBoardCopy: get().gamePuzzles![get().gamePuzzleIndex].gameLoop });
  },
  userBoard: null,
  coloredSquares: new Set<string>(),
  visitedColoredSquares: new Set<string>(),
  instructions: null,
  instructionBoard: null,

  currentInsertInstructionBox: { row: 0, col: 0 },
  changeInstructionBox: (coordinate) =>
    set({ currentInsertInstructionBox: coordinate }),
  feedInstruction: (move, paint, color) => {
    const { currentInsertInstructionBox, instructionBoard } = get();
    if (!instructionBoard) return;

    const { row, col } = currentInsertInstructionBox;

    const newBoard = instructionBoard.map((r) =>
      r.map((cell) => ({ ...cell })),
    );

    const cell = newBoard[row][col];

    if (cell.isStart) return;

    const next = { ...cell };
    if (color !== "") {
      // Replace color only
      next.color = color;
      next.colorSquare = true;

      newBoard[row][col] = next;
      set({ instructionBoard: newBoard });
      return;
    }

    if (paint !== "") {
      // If move exists, replace it
      if (next.move !== "NUll") {
        next.move = "NUll";
      }

      // Replace / add paint
      next.paintSquare = paint;

      newBoard[row][col] = next;
      set({ instructionBoard: newBoard });
      return;
    }

    if (move !== "NUll") {
      // If paint exists, replace it
      if (next.paintSquare !== "") {
        next.paintSquare = "";
      }

      // Replace / add move
      next.move = move;

      newBoard[row][col] = next;
      set({ instructionBoard: newBoard });
      return;
    }
  },
  _planeOverlaps: () => {
    const { planePos, startPos, gameBoard, coloredSquares, instructionBoard } =
      get();
    if (
      gameBoard![planePos.row][planePos.col].c === "" &&
      gameBoard![planePos.row][planePos.col].c === ""
    ) {
      setTimeout(() => {
        const { overlapResetCount } = get();
        const visitedColoredSquares = initVisitedSquares(
          startPos,
          coloredSquares,
        );
        const startInstructionIndex =
          getInstructionStartIndex(instructionBoard);
        set({
          planePos: startPos!,
          currentInstructionIndex: startInstructionIndex,
          rotationDegree: { from: 0, to: 0 },
          won: hasVisitedAllColoredSquares(
            visitedColoredSquares,
            coloredSquares,
          ),
          overlapResetCount: overlapResetCount + 1,
          visitedColoredSquares,
        });
      }, 500);
    }
  },
  _moveForward: () => {
    const {
      planePos,
      rotationDegree,
      _planeOverlaps,
      coloredSquares,
      visitedColoredSquares,
    } = get();
    let newPos: coordinates | undefined;
    if (rotationDegree.to === 0) {
      newPos = { row: planePos.row, col: planePos.col + 1 };
    } else if (rotationDegree.to === 180 || rotationDegree.to === -180) {
      newPos = { row: planePos.row, col: planePos.col - 1 };
    } else if (rotationDegree.to === 90 || rotationDegree.to === -270) {
      newPos = { row: planePos.row + 1, col: planePos.col };
    } else if (rotationDegree.to === -90 || rotationDegree.to === 270) {
      newPos = { row: planePos.row - 1, col: planePos.col };
    }

    let nextVisited = visitedColoredSquares;
    const key = posKey(newPos!);
    if (coloredSquares.has(key) && !visitedColoredSquares.has(key)) {
      nextVisited = new Set(visitedColoredSquares);
      nextVisited.add(key);
    }
    const nextWon = hasVisitedAllColoredSquares(nextVisited, coloredSquares);

    set({
      planePos: newPos,
      visitedColoredSquares: nextVisited,
      won: nextWon,
    });
    _planeOverlaps();
  },

  _changeGridColor: (color: COLORS) => {
    const { gameBoard, planePos } = get();
    if (color !== "") {
      const newBoard = gameBoard!.map((row, r) =>
        row.map((cell, c) =>
          r === planePos.row && c === planePos.col
            ? { ...cell, c: color }
            : cell,
        ),
      );
      set({ gameBoard: newBoard });
    }
  },
  play: () => {
    const {
      planePos,
      instructionBoard,
      rotationDegree,
      currentInstructionIndex,
      _changeGridColor,
      _moveForward,
      gameBoard,
    } = get();
    if (instructionBoard === null) return;
    let idx = currentInstructionIndex + 1;
    if (idx >= instructionBoard[0].length) {
      idx = backTrack(idx, instructionBoard);
    }
    const v = instructionBoard[0][currentInstructionIndex];

    if (v.move === "FORWARD" && v.color !== "") {
      /** check if current square matches the color given */
      /** Move the plane if it matches the box color */
      /** Check the plane rotation degree */
      if (gameBoard![planePos.row][planePos.col].c === v.color) {
        _moveForward();
      }
    } else if (v.move === "FORWARD" && v.color === "") {
      _moveForward();
    } else if (v.move === "TURN_LEFT" && v.color !== "") {
      if (gameBoard![planePos.row][planePos.col].c === v.color) {
        const { to } = rotationDegree;
        const degree = rt(to, -90);
        set({ rotationDegree: { from: to, to: degree } });
      }
    } else if (v.move === "TURN_LEFT") {
      const { to } = rotationDegree;
      const degree = rt(to, -90);
      set({ rotationDegree: { from: to, to: degree } });
    } else if (v.move === "TURN_RIGHT" && v.color !== "") {
      if (gameBoard![planePos.row][planePos.col].c === v.color) {
        const { to } = rotationDegree;
        const degree = rt(to, 90);
        set({ rotationDegree: { from: to, to: degree } });
      }
    } else if (v.move === "TURN_RIGHT") {
      const { to } = rotationDegree;
      const degree = rt(to, 90);
      set({ rotationDegree: { from: to, to: degree } });
    } else if (v.paintSquare !== "" && v.color !== "") {
      if (gameBoard![planePos.row][planePos.col].c !== v.paintSquare) {
        _changeGridColor(v.paintSquare);
      }
    } else if (v.paintSquare !== "") {
      _changeGridColor(v.paintSquare);
    } else if (v.move === "REPEAT" && v.color !== "") {
      if (gameBoard![planePos.row][planePos.col].c === v.color) {
        // check if there is a repeat loop in the front the set start Index to that;
        idx = backTrack(idx, instructionBoard);
      }
    } else if (v.move === "REPEAT") {
      idx = backTrack(idx, instructionBoard);
    }

    set({ currentInstructionIndex: idx });
  },
  resetGame: () => {
    const { gamePuzzleIndex, gamePuzzles, rotationDegree } = get();
    const { startPos } = findStart(gamePuzzles![gamePuzzleIndex].gameLoop);
    const coloredSquares = collectColoredSquares(
      gamePuzzles![gamePuzzleIndex].gameLoop,
    );
    const visitedColoredSquares = initVisitedSquares(startPos, coloredSquares);
    const startInstructionIndex = getInstructionStartIndex(
      gamePuzzles![gamePuzzleIndex].instructions,
    );
    set({
      planePos: startPos,
      startPos: startPos,
      rotationDegree: rotationDegree,
      won: hasVisitedAllColoredSquares(visitedColoredSquares, coloredSquares),
      currentInstructionIndex: startInstructionIndex,
      gameBoard: get().gameBoard!,
      coloredSquares,
      visitedColoredSquares,
      currentInsertInstructionBox: { row: 0, col: 0 },
      instructionBoard: gamePuzzles![gamePuzzleIndex].instructions,
    });
  },
}));

const backTrack = (
  currentIndex: number,
  instructionBoard: Instruction[][],
): number => {
  if (currentIndex >= instructionBoard[0].length) {
    for (let i = instructionBoard[0].length - 1; i >= 1; i--) {
      if (instructionBoard[0][i].move === "REPEAT") {
        const nextIndex = i + 1;
        return nextIndex < instructionBoard[0].length ? nextIndex : 1;
      }
    }
  }
  return 1;
};
export default useInstructionStore;
