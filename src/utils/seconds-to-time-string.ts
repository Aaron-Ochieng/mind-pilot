const secondsToTimeString = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, "0");

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  if (mins > 0) {
    return `${pad(mins)}:${pad(secs)}`;
  }

  return `00:${pad(secs)}`;
};

export default secondsToTimeString;
