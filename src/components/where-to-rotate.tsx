const WhereToRotate = (rotationDegree: number): string => {
  const normalized = (rotationDegree % 360 + 360) % 360;
  if (normalized === 0) return "rotate-0";
  if (normalized === 90) return "rotate-90";
  if (normalized === 180) return "rotate-180";
  if (normalized === 270) return "rotate-270";
  return "";
};

export default WhereToRotate;
