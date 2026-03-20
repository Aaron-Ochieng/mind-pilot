import secondsToTimeString from "@/utils/seconds-to-time-string";
import { Text } from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";

interface TimerProps {
  onComplete: () => void;
  isPlaying: boolean;
  keyProp: number; // Used to reset timer
}

const Timer = ({ onComplete, isPlaying, keyProp }: TimerProps) => {
  return (
    <CountdownCircleTimer
      key={keyProp}
      strokeWidth={2}
      size={100}
      isPlaying={isPlaying}
      duration={300} // 5 minutes
      colors={["#3B82F6", "#F7B801", "#A50000", "#A30000"]}
      colorsTime={[225, 125, 100, 75]}
      onComplete={() => {
        onComplete();
        return { shouldRepeat: false };
      }}
    >
      {({ remainingTime }) => (
        <Text
          className="text-white"
          style={{ fontFamily: "JetBrainsMono_400Regular" }}
        >
          {secondsToTimeString(remainingTime)}
        </Text>
      )}
    </CountdownCircleTimer>
  );
};
export default Timer;
