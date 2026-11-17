import React, {
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
  useId,
  createContext,
} from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Svg, {
  Circle,
  Path,
  Rect,
  Defs,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "../platform/gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { C } from "./content";
import {
  frameLayout,
  horizontalRect,
  type CanvasLayout,
  type HorizontalAnchor,
} from "./layout";

const CanvasContext = createContext<CanvasLayout>({
  referenceWidth: 360,
  width: 360,
  referenceHeight: 800,
  height: 800,
});
export const useCanvasLayout = () => useContext(CanvasContext);

export function T({
  children,
  size = 14,
  weight = 500,
  color = C.ink,
  style,
}: {
  children: ReactNode;
  size?: number;
  weight?: number;
  color?: string;
  style?: TextStyle;
}) {
  const family =
    weight >= 800
      ? "Outfit_800ExtraBold"
      : weight >= 700
        ? "Outfit_700Bold"
        : weight >= 600
          ? "Outfit_600SemiBold"
          : weight >= 500
            ? "Outfit_500Medium"
            : "Outfit_400Regular";
  return (
    <Text
      style={[
        { fontFamily: family, fontSize: size, lineHeight: size * 1.22, color },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function At({
  x = 0,
  y = 0,
  w,
  h,
  children,
  style,
  horizontal = "auto",
  anchor = "top",
  fill = false,
  fillToBottom = false,
}: {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  children?: ReactNode;
  style?: ViewStyle;
  horizontal?: HorizontalAnchor;
  anchor?: "top" | "bottom";
  fill?: boolean;
  fillToBottom?: boolean;
}) {
  const parent = useCanvasLayout();
  const sourceX = typeof style?.left === "number" ? style.left : x;
  const sourceY = typeof style?.top === "number" ? style.top : y;
  const sourceWidth = typeof style?.width === "number" ? style.width : w;
  const sourceHeight = typeof style?.height === "number" ? style.height : h;
  const rect = horizontalRect(parent, sourceX, sourceWidth, horizontal);
  const extraHeight = parent.height - parent.referenceHeight;
  const actualHeight = fill
    ? parent.height
    : fillToBottom && sourceHeight !== undefined
      ? Math.max(1, sourceHeight + extraHeight)
      : sourceHeight;
  const actualWidth = fill ? parent.width : rect.width;
  const bounds = {
    position: "absolute" as const,
    left: fill ? 0 : rect.x,
    top: fill ? 0 : sourceY + (anchor === "bottom" ? extraHeight : 0),
    width: actualWidth,
    height: actualHeight,
  };
  const scope: CanvasLayout = {
    referenceWidth: sourceWidth ?? parent.referenceWidth,
    width: actualWidth ?? sourceWidth ?? parent.referenceWidth,
    referenceHeight: sourceHeight ?? parent.referenceHeight,
    height: actualHeight ?? sourceHeight ?? parent.referenceHeight,
  };
  return (
    <View style={[style, bounds]}>
      <CanvasContext.Provider value={scope}>{children}</CanvasContext.Provider>
    </View>
  );
}
export const shadow: ViewStyle = {
  shadowColor: "#192343",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.07,
  shadowRadius: 9,
  elevation: 2,
};
export const PulseContext = createContext<{ x: number; y: number } | null>(
  null,
);
export function Card({
  x = 24,
  y,
  w = 312,
  h,
  children,
  style,
}: {
  x?: number;
  y: number;
  w?: number;
  h: number;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const focus = useContext(PulseContext);
  const active = !!focus && focus.x === x && focus.y === y;
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (active && !reduced)
      scale.set(
        withSequence(
          withTiming(1.03, { duration: 150 }),
          withTiming(1, { duration: 150 }),
        ),
      );
    else scale.set(1);
  }, [active, reduced]);
  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return (
    <At x={x} y={y} w={w} h={h}>
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: "white",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#E0E3ED",
            ...shadow,
            ...style,
          },
          motion,
        ]}
      >
        {children}
      </Animated.View>
    </At>
  );
}
export function Button({
  label,
  onPress,
  disabled = false,
  x = 28,
  y,
  w = 304,
  h = 54,
  arrow = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  x?: number;
  y: number;
  w?: number;
  h?: number;
  arrow?: boolean;
}) {
  return (
    <At x={x} y={y} w={w} h={h} anchor="bottom">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          borderRadius: 30,
          backgroundColor: disabled ? "#DCE1EE" : C.green,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 14,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          ...(!disabled
            ? {
                shadowColor: C.green,
                shadowOpacity: 0.28,
                shadowRadius: 11,
                shadowOffset: { width: 0, height: 7 },
                elevation: 3,
              }
            : {}),
        })}
      >
        <T size={18} weight={800} color={disabled ? "#929CB8" : C.ink}>
          {label}
        </T>
        {arrow && (
          <Icon name="arrow" size={20} color={disabled ? "#929CB8" : C.ink} />
        )}
      </Pressable>
    </At>
  );
}
export function Icon({
  name,
  size = 22,
  color = C.blue,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const paths: Record<string, string> = {
    arrow: "M4 12h15m-6-6 6 6-6 6",
    back: "m14 5-7 7 7 7",
    check: "m5 12 4 4 10-10",
    calendar: "M5 5h14v15H5zM8 2v6m8-6v6M5 10h14m-11 3h2m3 0h2m-7 4h2m3 0h2",
    shield: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6zM7 12l3 3 7-7",
    bell: "M18 8a6 6 0 0 0-12 0c0 6-3 7-3 7h18s-3-1-3-7m-9 12h6",
    profile: "M8 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21a8 8 0 0 1 16 0",
    document: "M6 2h8l4 4v16H6zM14 2v5h4M9 11h6m-6 4h6m-6 4h4",
    id: "M3 4h18v16H3zM6 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0m-1 7c0-5 6-5 6 0m3-7h4m-4 4h4",
    phone: "M8 2h8v20H8zM11 18h2M4 7v10m16-10v10",
    bank: "m2 7 10-5 10 5H2m2 14h16M6 9v10m6-10v10m6-10v10",
    lock: "M6 11h12v11H6zM8 11V6a4 4 0 0 1 8 0v5",
    retry: "M19 7a8 8 0 1 0 1 9M19 2v6h-6",
    gift: "M3 8h18v5H3zM5 13v9h14v-9M12 8v14m0-14c-7 0-7-8-2-5l2 5c7 0 7-8 2-5z",
    refund: "M9 6 4 11l5 5M4 11h10a5 5 0 0 1 0 10",
    info: "M12 10v7m0-11v.2",
    warning:
      "M10.2 3.7 1.5 19a1.5 1.5 0 0 0 1.3 2h18.4a1.5 1.5 0 0 0 1.3-2L13.8 3.7a2 2 0 0 0-3.6 0ZM12 9v5m0 3v.2",
    selfie:
      "M7 2h10v20H7zM9.5 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0M9 18c0-5 6-5 6 0",
    people:
      "M6 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6m12 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6M1 20v-2c0-5 10-5 10 0v2Zm12 0v-2c0-5 10-5 10 0v2Z",
    speaker: "M3 9h4l5-5v16l-5-5H3ZM16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14",
    "speaker-off": "M3 9h4l5-5v16l-5-5H3Zm13 0 6 6m0-6-6 6",
    whatsapp:
      "M20 11a8 8 0 0 1-12 7l-5 2 1-5A8 8 0 1 1 20 11ZM8 7c0 4 3 7 7 7l1-2-3-1-1 1-2-2 1-1-1-2Z",
  };
  if (name === "people")
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={8} cy={8} r={3} fill={color} />
        <Circle cx={16} cy={8} r={3} fill={color} />
        <Path
          d="M2 20v-3c0-5 12-5 12 0v3Zm11 0v-3q0-3-2-4c7-3 11 1 11 4v3Z"
          fill={color}
        />
      </Svg>
    );
  if (name === "covered-shield")
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle
          cx={12}
          cy={12}
          r={10}
          stroke={color}
          strokeWidth={1.2}
          strokeDasharray="2 3"
          fill="none"
        />
        <Path d="m12 5-5 2v5c0 3 2 5 5 7 3-2 5-4 5-7V7Z" fill={color} />
        <Path
          d="m9.5 11.5 2 2 3-4"
          stroke="white"
          strokeWidth={1.3}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    );
  if (name === "shield-filled")
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 1 3 5v7c0 5 4 9 9 12 5-3 9-7 9-12V5Z" fill={color} />
        <Path
          d="m7.5 12 3 3 6-7"
          stroke="white"
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={paths[name] ?? paths.document}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function CircleIcon({
  name,
  fill = "#E4F9EE",
  color = C.money,
  size = 42,
}: {
  name: string;
  fill?: string;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius:
          size /
          (name === "refund" || name === "info" || name === "people" ? 2 : 3),
        backgroundColor: fill,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        name={name}
        size={size * (name === "shield-filled" ? 0.74 : 0.57)}
        color={color}
      />
    </View>
  );
}
export function Check({ size = 18 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.money,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "white",
      }}
    >
      <Icon name="check" size={size * 0.7} color="white" />
    </View>
  );
}
export function Frame({
  children,
  review = false,
  darkIndicator = false,
  sceneKey,
  overlay,
}: {
  children: ReactNode;
  review?: boolean;
  darkIndicator?: boolean;
  sceneKey?: string;
  overlay?: ReactNode;
}) {
  const glowId=useId();
  const window = useWindowDimensions();
  const [bounds, setBounds] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const insets = useSafeAreaInsets();
  const native = Platform.OS !== "web" || (typeof location !== "undefined" && new URLSearchParams(location.search).get("android") === "1");
  const top = native ? insets.top : 0;
  const bottom = native ? insets.bottom : 0;
  const metrics = frameLayout(
    bounds?.width ?? window.width,
    bounds?.height ?? window.height,
    top,
    bottom,
    native,
  );
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [sceneKey, metrics.width, metrics.viewportHeight]);
  const layout: CanvasLayout = {
    referenceWidth: 360,
    width: metrics.width,
    referenceHeight: 800,
    height: metrics.height,
  };
  const canvasStyle: ViewStyle = {
    position: "absolute",
    left: 0,
    top: -metrics.trimTop * metrics.scale,
    width: metrics.width,
    height: metrics.height,
    transform: [{ scale: metrics.scale }],
    transformOrigin: "top left",
  };
  return (
    <View
      onLayout={({ nativeEvent: { layout: next } }) => {
        if (next.width > 0 && next.height > 0)
          setBounds((previous) =>
            previous?.width === next.width && previous?.height === next.height
              ? previous
              : { width: next.width, height: next.height },
          );
      }}
      style={{
        flex: 1,
        paddingTop: top,
        paddingBottom: bottom,
        backgroundColor: C.blue,
      }}
    >
      <LinearGradient
        colors={["#001FC5", "#0015AC", "#001AAD"]}
        locations={[0, 0.625, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={glowId} cx="100%" cy="0%" rx="95%" ry="48%">
            <Stop offset="0" stopColor="#365CFF" stopOpacity={0.85} />
            <Stop offset="1" stopColor="#365CFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${glowId})`} />
      </Svg>
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: "center" }}
        scrollEnabled={metrics.contentHeight > metrics.viewportHeight + 0.5}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        bounces={false}
      >
        <View
          style={{
            width: metrics.physicalWidth,
            height: metrics.contentHeight,
            overflow: "hidden",
          }}
        >
          <View style={canvasStyle}>
            <CanvasContext.Provider value={layout}>
              {children}
              {review && !native && (
                <>
                  <At x={26} y={8}>
                    <T size={15} weight={600} color="white">
                      9:30
                    </T>
                  </At>
                  <At x={269} y={11}>
                    <Svg width={69} height={13} viewBox="0 0 69 13">
                      <Path
                        d="M2 8v4m4-6v6m4-9v9m4-11v11m9-7q5-5 10 0m-8 3q3-3 6 0m-4 2h2"
                        fill="none"
                        stroke="white"
                        strokeWidth={2.5}
                      />
                      <Rect
                        x={43}
                        y={1}
                        width={22}
                        height={11}
                        rx={3}
                        stroke="white"
                        fill="none"
                      />
                      <Rect
                        x={45}
                        y={3}
                        width={18}
                        height={7}
                        rx={1}
                        fill="white"
                      />
                      <Rect x={66} y={4} width={2} height={5} fill="white" />
                    </Svg>
                  </At>
                </>
              )}
              {!native && (
                <At
                  x={119}
                  y={791}
                  anchor="bottom"
                  w={122}
                  h={4}
                  style={{
                    backgroundColor: darkIndicator ? C.ink : "white",
                    borderRadius: 3,
                  }}
                />
              )}
            </CanvasContext.Provider>
          </View>
        </View>
      </ScrollView>
      {overlay && (
        <>
          {native && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: bottom,
                backgroundColor: "white",
              }}
            />
          )}
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top,
              bottom,
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <View
              pointerEvents="box-none"
              style={{
                width: metrics.physicalWidth,
                height: metrics.viewportHeight,
              }}
            >
              <View
                pointerEvents="box-none"
                style={[canvasStyle, { height: metrics.overlayHeight }]}
              >
                <CanvasContext.Provider
                  value={{ ...layout, height: metrics.overlayHeight }}
                >
                  {overlay}
                </CanvasContext.Provider>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
export function Header({
  title,
  progress,
  onBack,
  real = false,
  onSupport,
  onProfile,
  welcome = false,
  closing = false,
  celebrate = false,
}: {
  title?: string;
  progress: number;
  onBack?: () => void;
  real?: boolean;
  onSupport?: () => void;
  onProfile?: () => void;
  welcome?: boolean;
  closing?: boolean;
  celebrate?: boolean;
}) {
  return (
    <>
      <At
        x={20}
        y={welcome ? 52 : closing ? 62 : 42}
        w={welcome ? 246 : 320}
        h={5}
        style={{ flexDirection: "row", gap: 5 }}
      >
        {Array.from({ length: real ? 3 : 6 }, (_, i) => (
          <ProgressSegment
            key={i}
            complete={i < progress}
            glow={celebrate && i === 4}
          />
        ))}
      </At>
      {onBack && (
        <At
          x={closing ? 10 : 20}
          y={closing ? 78 : 54}
          w={closing ? 24 : 32}
          h={closing ? 28 : 32}
        >
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={8}
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF22",
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="back" color="white" size={closing ? 13 : 21} />
          </Pressable>
        </At>
      )}
      {title && (
        <At
          x={real ? 62 : 20}
          y={real ? 56 : 89}
          w={real ? (real && title === "Tu primer pago" ? 180 : 208) : 320}
        >
          <T size={real ? 24 : title === "Aquí todos están verificados" ? 24 : 26} weight={800} color="white">
            {title}
          </T>
        </At>
      )}
      {real && (
        <At
          x={title === "Tu primer pago" ? 256 : 268}
          y={54}
          w={title === "Tu primer pago" ? 84 : 72}
          h={32}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <Pressable
            onPress={onSupport}
            accessibilityRole="button"
            accessibilityLabel="Ayuda por WhatsApp"
            style={{
              height: 32,
              width: title === "Tu primer pago" ? 84 : 32,
              backgroundColor: C.green,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 5,
            }}
          >
            <Icon name="whatsapp" size={22} color="white" />
            {title === "Tu primer pago" && (
              <T weight={700} size={13} color="white">
                Ayuda
              </T>
            )}
          </Pressable>
          {title !== "Tu primer pago" && (
            <Pressable
              onPress={onProfile}
              accessibilityRole="button"
              accessibilityLabel="Perfil"
              style={{
                height: 32,
                width: 32,
                backgroundColor: "#FFFFFF22",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="profile" size={20} color="white" />
            </Pressable>
          )}
        </At>
      )}
    </>
  );
}
function ProgressSegment({
  complete,
  glow,
}: {
  complete: boolean;
  glow: boolean;
}) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (glow && !reduced)
      pulse.set(
        withSequence(
          withTiming(1, { duration: 220 }),
          withTiming(0, { duration: 500 }),
        ),
      );
  }, [glow, reduced]);
  const motion = useAnimatedStyle(() => ({
    opacity: pulse.get() * 0.7,
    transform: [{ scaleX: 1.08 }, { scaleY: 2 + pulse.get() * 0.8 }],
  }));
  return (
    <View
      style={{
        flex: 1,
        height: 5,
        borderRadius: 3,
        backgroundColor: complete ? C.green : "#5367E2",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            borderRadius: 4,
            backgroundColor: C.green,
            shadowColor: C.green,
            shadowOpacity: 1,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 0 },
          },
          motion,
        ]}
      />
    </View>
  );
}
export const illustration = {
  account: require("../../assets/venezuela-v19/one-account.png"),
  group: require("../../assets/venezuela-v19/rule-group.png"),
  verified: require("../../assets/venezuela-v19/verified-group.png"),
  ideas: [require("../../assets/ideas/idea-1.png"),require("../../assets/ideas/idea-2.png"),require("../../assets/ideas/idea-3.png"),require("../../assets/ideas/idea-4.png"),require("../../assets/ideas/idea-5.png"),require("../../assets/ideas/idea-6.png")],
  how: [
    require("../../assets/how/step-1.png"),
    require("../../assets/how/step-2.png"),
    require("../../assets/how/step-3.png"),
  ],
  daniela: require("../../assets/tour-v3/daniela.png"),
  tutu: require("../../assets/piggy/tutu_talk_1_poster.png"),
};
export function Face({ size = 42 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/venezuela-v19/tutu-guide-face.png")}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  );
}
