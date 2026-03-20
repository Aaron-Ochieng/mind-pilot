const WhereToRotate = (rotationDegree: number): string => {
  if (rotationDegree === 0 || rotationDegree === -0) {
    return "rotate-0";
  }
  if (rotationDegree === -90 || rotationDegree === -270) {
    return "-rotate-90";
  }
  if (rotationDegree === 90) return "rotate-90";
  if (rotationDegree === 270) return "rotate-270";

  if (rotationDegree === 180 || rotationDegree === -180) return "rotate-180";
  return "";
};

export default WhereToRotate;
