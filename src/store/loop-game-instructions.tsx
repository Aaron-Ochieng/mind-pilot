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
  pathSquares: Set<string>;
  targetSquares: Set<string>;
  visitedTargets: Set<string>;
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

const collectPathSquares = (board: Loop[][]): Set<string> => {
  const path = new Set<string>();
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].c !== "" || board[row][col].iE || board[row][col].iS) {
        path.add(`${row}:${col}`);
      }
    }
  }
  return path;
};

const collectTargetSquares = (board: Loop[][]): Set<string> => {
  const targets = new Set<string>();
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].iE) {
        targets.add(`${row}:${col}`);
      }
    }
  }
  return targets;
};

const initVisitedTargets = (
  startPos: coordinates | null,
  targetSquares: Set<string>,
): Set<string> => {
  const visited = new Set<string>();
  if (startPos) {
    const key = posKey(startPos);
    if (targetSquares.has(key)) {
      visited.add(key);
    }
  }
  return visited;
};

const hasVisitedAllTargets = (
  visited: Set<string>,
  targetSquares: Set<string>,
): boolean => targetSquares.size > 0 && visited.size >= targetSquares.size;

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
    if (!gamePuzzle || gamePuzzle.length === 0) {
      set({ gamePuzzles: [] });
      return;
    }
    let gameIndex: number = 0;
    gamePuzzle.map((k, idx) => {
      if (!k.solved) {
        gameIndex = idx;
      }
    });
    const firstPuzzle = gamePuzzle[gameIndex];
    const { startPos } = findStart(gamePuzzle[gameIndex].gameLoop);
    const pathSquares = collectPathSquares(gamePuzzle[gameIndex].gameLoop);
    const targetSquares = collectTargetSquares(gamePuzzle[gameIndex].gameLoop);
    const visitedTargets = initVisitedTargets(startPos, targetSquares);
    const startInstructionIndex = getInstructionStartIndex(
      firstPuzzle ? firstPuzzle.instructions : null,
    );

    // Clear iE at startPos in the initial gameBoard
    const initialBoard = firstPuzzle.gameLoop.map((row, r) =>
      row.map((cell, c) =>
        r === startPos.row && c === startPos.col
          ? { ...cell, iE: false }
          : cell,
      ),
    );

    set({
      gamePuzzles: gamePuzzle,
      instructionBoard: firstPuzzle ? firstPuzzle.instructions : null,
      gameBoard: initialBoard,
      startPos: startPos,
      planePos: startPos,
      rotationDegree: gamePuzzle[gameIndex].rotationDegree,
      pathSquares,
      targetSquares,
      visitedTargets,
      won: hasVisitedAllTargets(visitedTargets, targetSquares),
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
  pathSquares: new Set<string>(),
  targetSquares: new Set<string>(),
  visitedTargets: new Set<string>(),
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
    const {
      planePos,
      startPos,
      gameBoard,
      pathSquares,
      targetSquares,
      instructionBoard,
      won,
    } = get();
    if (won) return;

    const key = posKey(planePos);
    const isOutOfBounds =
      planePos.row < 0 ||
      planePos.row >= gameBoard!.length ||
      planePos.col < 0 ||
      planePos.col >= gameBoard![0].length;

    if (
      isOutOfBounds ||
      (!pathSquares.has(key) && key !== posKey(startPos!))
    ) {
      setTimeout(() => {
        const { overlapResetCount, gamePuzzleIndex, gamePuzzles } = get();
        const visitedTargets = initVisitedTargets(startPos, targetSquares);
        const startInstructionIndex =
          getInstructionStartIndex(instructionBoard);

        // Reset gameBoard from original puzzle data when overlap happens (failure)
        const resetBoard = gamePuzzles![gamePuzzleIndex].gameLoop.map(
          (row, r) =>
            row.map((cell, c) =>
              r === startPos!.row && c === startPos!.col
                ? { ...cell, iE: false }
                : cell,
            ),
        );

        set({
          planePos: startPos!,
          currentInstructionIndex: startInstructionIndex,
          rotationDegree: { from: 0, to: 0 },
          won: hasVisitedAllTargets(visitedTargets, targetSquares),
          overlapResetCount: overlapResetCount + 1,
          visitedTargets,
          gameBoard: resetBoard,
        });
      }, 500);
    }
  },
  _moveForward: () => {
    const {
      planePos,
      rotationDegree,
      _planeOverlaps,
      targetSquares,
      visitedTargets,
      gameBoard,
    } = get();

    const normalized = (rotationDegree.to % 360 + 360) % 360;
    let newPos: coordinates | undefined;

    if (normalized === 0) {
      newPos = { row: planePos.row, col: planePos.col + 1 };
    } else if (normalized === 90) {
      newPos = { row: planePos.row + 1, col: planePos.col };
    } else if (normalized === 180) {
      newPos = { row: planePos.row, col: planePos.col - 1 };
    } else if (normalized === 270) {
      newPos = { row: planePos.row - 1, col: planePos.col };
    }

    let nextVisited = visitedTargets;
    const key = posKey(newPos!);
    let nextBoard = gameBoard;

    const isOutOfBounds =
      newPos!.row < 0 ||
      newPos!.row >= gameBoard!.length ||
      newPos!.col < 0 ||
      newPos!.col >= gameBoard![0].length;

    if (!isOutOfBounds && targetSquares.has(key)) {
      if (!visitedTargets.has(key)) {
        nextVisited = new Set(visitedTargets);
        nextVisited.add(key);
      }

      // Clear iE if present
      if (gameBoard![newPos!.row][newPos!.col].iE) {
        nextBoard = gameBoard!.map((row, r) =>
          row.map((cell, c) =>
            r === newPos!.row && c === newPos!.col
              ? { ...cell, iE: false }
              : cell,
          ),
        );
      }
    }

    const nextWon = hasVisitedAllTargets(nextVisited, targetSquares);

    set({
      planePos: newPos,
      visitedTargets: nextVisited,
      won: nextWon,
      gameBoard: nextBoard,
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
    if (!gamePuzzles || gamePuzzles.length === 0) return;
    const { startPos } = findStart(gamePuzzles![gamePuzzleIndex].gameLoop);
    const pathSquares = collectPathSquares(
      gamePuzzles![gamePuzzleIndex].gameLoop,
    );
    const targetSquares = collectTargetSquares(
      gamePuzzles![gamePuzzleIndex].gameLoop,
    );
    const visitedTargets = initVisitedTargets(startPos, targetSquares);
    const startInstructionIndex = getInstructionStartIndex(
      gamePuzzles![gamePuzzleIndex].instructions,
    );

    // Reset gameBoard from original puzzle data
    const resetBoard = gamePuzzles![gamePuzzleIndex].gameLoop.map((row, r) =>
      row.map((cell, c) =>
        r === startPos.row && c === startPos.col
          ? { ...cell, iE: false }
          : cell,
      ),
    );

    set({
      planePos: startPos,
      startPos: startPos,
      rotationDegree: { from: 0, to: 0 }, // Reset rotation too
      won: hasVisitedAllTargets(visitedTargets, targetSquares),
      currentInstructionIndex: startInstructionIndex,
      gameBoard: resetBoard,
      pathSquares,
      targetSquares,
      visitedTargets,
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
