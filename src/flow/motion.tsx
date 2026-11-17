import { type ReactNode, useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { View, type ViewStyle } from "react-native";
import { C } from "./content";

/** One finite wheel celebration; no frame callbacks enter the JS runtime. */
export function WheelConfetti() {
  const reduced = useReducedMotion();
  const clock = useSharedValue(0);
  useEffect(() => {
    clock.set(withTiming(1, { duration: 1200, easing: Easing.linear }));
  }, []);
  if (reduced) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 20,
        top: 15,
        width: 270,
        height: 165,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 16 }, (_, i) => (
        <Piece key={i} i={i} clock={clock} />
      ))}
    </View>
  );
}
function Piece({ i, clock }: { i: number; clock: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const p = clock.get();
    return {
      opacity: p < 0.8 ? 1 : Math.max(0, 1 - (p - 0.8) * 5),
      transform: [
        { translateX: 130 + (i % 2 ? 1 : -1) * (20 + i * 6) * p },
        { translateY: 90 - 140 * p + 175 * p * p },
        { rotate: `${i * 31 + p * 440}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: i % 3 ? 6 : 4,
          height: i % 3 ? 3 : 6,
          backgroundColor: [C.blue, C.green, "#F8C62B", "#359BFF"][i % 4],
        },
        style,
      ]}
    />
  );
}

/** Fixed-layout entrances keep reference geometry and run on the UI thread.
 * v19 explicitly prescribes a 600ms panel and 200ms step intervals.
 */
export function Entrance({ children, delay = 0, duration = 300, distance = 8,
  disabled = false, style, pointerEvents }: {
  children: ReactNode; delay?: number; duration?: number; distance?: number;
  disabled?: boolean; style?: ViewStyle; pointerEvents?: "box-none";
}) {
  const reduced = useReducedMotion();
  const skip = reduced || disabled;
  const progress = useSharedValue(skip ? 1 : 0);
  useEffect(() => {
    progress.set(skip ? 1 : 0);
    if (!skip) progress.set(withDelay(delay, withTiming(1, {
      duration, easing: Easing.bezier(0.32, 0.72, 0, 1),
    })));
  }, [skip, delay, duration]);
  const motion = useAnimatedStyle(() => ({ opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * distance }],
  }));
  return <Animated.View pointerEvents={pointerEvents} style={[style, motion]}>{children}</Animated.View>;
}
