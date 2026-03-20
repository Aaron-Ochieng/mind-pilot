export const rotationDegree = (from: number, to: number): number => {
  return (from + to) % 360;
};
