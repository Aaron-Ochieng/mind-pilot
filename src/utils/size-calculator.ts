import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Calculates the size of each grid box to fit perfectly within the screen width.
 * @param gridSize - The number of boxes per row (e.g., 8 to 16).
 * @param margin - The total horizontal margin/padding in pixels.
 * @returns The calculated box size in pixels.
 */
export const calculateBoxSize = (gridSize: number, margin: number = 32): number => {
  // We subtract the total margin and divide by the number of items.
  // We also subtract (gridSize - 1) to account for 1px gap between boxes.
  const availableWidth = SCREEN_WIDTH - margin;
  const gap = 1; // 1px gap from the className "m-[1px]" or similar
  
  // Total gap space is gridSize * 2 because of m-[1px] (left and right)
  const totalGapSpace = gridSize * 2;
  
  const boxSize = (availableWidth - totalGapSpace) / gridSize;
  
  return Math.floor(boxSize);
};
