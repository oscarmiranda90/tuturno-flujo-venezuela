import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { Image } from '../../platform/image';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, {
  Defs,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import * as Haptics from '../../platform/haptics';

import { Text } from '../Text';
import { practiceMoney } from '../../domain/money';
import { fontFamily, palette } from '../../theme';

/*
  The red "tu turno" dispenser (a raster render) with a vector ticket that
  feeds out of its blue mouth, tears off and comes forward to be read.

  The render is split in two so the paper comes from inside the machine:
    back   the full render, mouth interior and lower lip included
    middle the ticket while it prints
    front  the same render with the mouth cut away below the upper rim, plus a
           soft shadow the rim casts on the paper (turn-dispenser-front.webp)

  The mouth is only ~14% of the render's width, so a ticket that stayed at
  slot size would be unreadable on a phone. The ticket therefore moves in two
  phases: it prints at slot size between the two layers (the upper rim and the
  body hide the paper still inside), drops out of the mouth, and then a second
  copy in front of everything grows toward the viewer. The mouth faces the camera, so
  growing as it approaches reads as depth rather than a trick.
*/

const DISPENSER = require('../../../assets/brand/layers/cuerpo.png');
const GLASS = require('../../../assets/brand/layers/vidrio.png');
const MOUTH = require('../../../assets/brand/layers/boca.png');
const DISPENSER_FRONT = require('../../../assets/brand/turn-dispenser-front.webp');

/** Source render size; every slot coordinate below is a fraction of it. */
const SRC_W = 1371;
const SRC_H = 1148;
/** The paper path inside the mouth, measured on the 1371×1148 source. */
const SLOT = {
  /*
    The paper's width at slot size, shifted left of the mouth's centre: printing
    along the tilted axis carries the paper ~0.24 px right per px down, and its
    right edge must stay clear of the mouth's right inner wall (x ≈ 1170, front
    layer) until it passes the lip.
  */
  left: 948 / SRC_W,
  right: 1138 / SRC_W,
  /** Centre of the fed paper's top edge (x ≈ 1043), just above the rim's inner
   *  edge there (≈ 874): hidden under the rim. */
  top: 858 / SRC_H,
  /** How far the paper slides along its own axis after printing, so its whole
   *  top edge clears the rim (the right corner curves down to ~885) and nothing
   *  in the front layer overlaps it when the copies swap. */
  drop: 60 / SRC_H,
  /** Top of the dark bezel over the paper path. Above it the render is
   *  transparent, so the paper waiting inside is clipped here. */
  housing: 770 / SRC_H,
  /** Lowest point of the blue lip; the paper must clear it before the swap. */
  lip: 984 / SRC_H,
};

/** The mouth is tilted: its rim rises 35 px over 140 px to the right (~14°).
 *  The paper prints along that axis, then straightens as it hangs. */
const MOUTH_TILT = -14;
const HANG_TILT = -3;
const TILT_RAD = (MOUTH_TILT * Math.PI) / 180;
/** The paper's "down" in screen space, perpendicular to the tilted rim. */
const FEED_AXIS = { x: -Math.sin(TILT_RAD), y: Math.cos(TILT_RAD) };

/** The ticket's own coordinate space (design size at full scale). */
const TICKET_W = 220;
const TICKET_H = 236;
const TEETH = 11;
const TOOTH_DEPTH = 9;
const BODY_H = TICKET_H - TOOTH_DEPTH;

const INK = palette.navy[900];
const INK_SOFT = '#5B6690';
const SUCCESS = palette.mint[600];

const FEED_MS = 1150;
const DROP_MS = 170;
const START_DELAY_MS = 350;
/** Motor rumble while printing: small, fast and uneven, never a wobble. */
const RUMBLE_PX = 0.9;
const RUMBLE_DEG = 0.35;
/** Haptic ticks while the paper feeds (native only; web ignores them). */
const RUMBLE_TICK_MS = 95;

const CONFETTI_COLORS = [
  palette.navy[600],
  SUCCESS,
  '#E9B949',
  palette.sky[500],
  '#FF6B6B',
  palette.mint[500],
];
const CONFETTI = Array.from({ length: 26 }, (_, i) => {
  const angle = -Math.PI / 2 + ((i % 13) / 12 - 0.5) * Math.PI * 1.5;
  const speed = 230 + ((i * 53) % 150);
  return {
    vx: Math.cos(angle) * speed * (i < 13 ? 1 : 0.6),
    vy: Math.sin(angle) * speed * (i < 13 ? 1 : 0.7),
    spin: ((i * 97) % 720) - 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    w: i % 3 === 0 ? 6 : 9,
    h: i % 3 === 0 ? 6 : 4,
  };
});

export interface TurnTicketDispenserProps {
  /** Stage width in points; the render and the ticket scale from it. */
  width?: number;
  country?: 'VE' | 'CO';
  /** False restores the final pose when returning to an already viewed screen. */
  animateOnMount?: boolean;
  /** Called when the initial print begins, including reduced motion. */
  onPrintStart?: () => void;
  /** The amount on the ticket. Defaults to the country's demo amount. */
  amount?: number;
  /** A country-specific screen can supply its approved amount format. */
  formattedAmount?: string;
  /** Horizontal landing adjustment for an approved reference composition. */
  ticketLandingOffsetX?: number;
  /** Tap replays the print (useful in demos). */
  replayOnPress?: boolean;
  /** Called once the ticket has landed in front of the viewer. */
  onPresented?: () => void;
  /** Continuous celebration for the tour closing; other surfaces retain the burst. */
  confettiMode?: 'burst' | 'rain';
  /** Approved v19 roll and reserved-word choreography. */
  v19Motion?: boolean;
}

export function TurnTicketDispenser({
  width = 340,
  amount,
  formattedAmount,
  ticketLandingOffsetX = 0,
  country = 'VE',
  animateOnMount = true,
  onPrintStart,
  replayOnPress = true,
  onPresented,
  confettiMode = 'burst',
  v19Motion = false,
}: TurnTicketDispenserProps) {
  const reduceMotion = useReducedMotion();
  const formatted = formattedAmount ?? practiceMoney(
    amount ?? (country === 'CO' ? 300000 : 100),
    country,
  );
  const shouldAnimate = useRef(animateOnMount).current;
  const callbacks = useRef({ onPresented, onPrintStart });
  callbacks.current = { onPresented, onPrintStart };

  // Stage geometry, all derived from the stage width.
  // The render sits left so the mouth lands right of centre and the ticket,
  // hanging from it, still fits inside the stage.
  const dispW = width * 0.94;
  const dispH = dispW * (SRC_H / SRC_W);
  const dispLeft = width * -0.1;
  /** Horizontal centre of the paper path; both copies hang from it. */
  const slotCenter = dispLeft + ((SLOT.left + SLOT.right) / 2) * dispW;
  const slotTop = SLOT.top * dispH;
  const lipY = SLOT.lip * dispH;
  const feedScale = ((SLOT.right - SLOT.left) * dispW) / TICKET_W;
  const fedH = TICKET_H * feedScale;
  /** Fully fed, the paper's top sits under the rim; dropping it this far frees it. */
  const dropBy = SLOT.drop * dispH;
  /** Where the top centre is once it has dropped: the front copy starts here. */
  const freedX = slotCenter + FEED_AXIS.x * dropBy;
  const freedY = slotTop + FEED_AXIS.y * dropBy;

  // Full size, the ticket hangs from the lip, centred on the mouth but kept
  // inside the stage.
  const finalScale = Math.min(1, (width * 0.64) / TICKET_W);
  const finalHalf = (TICKET_W * finalScale) / 2;
  const finalCenter =
    Math.min(slotCenter, width - finalHalf - 4) -
    (confettiMode === 'rain' ? width * 0.11 : 0) + ticketLandingOffsetX;
  const finalTop = lipY + 1;
  const stageH = finalTop + TICKET_H * finalScale + 16;
  const clipTop = SLOT.housing * dispH;
  const renderFrame = {
    position: 'absolute' as const,
    left: dispLeft,
    top: 0,
    width: dispW,
    height: dispH,
  };

  const feed = useSharedValue(0); // 0 inside the mouth → 1 fully printed
  const drop = useSharedValue(0); // 0 resting → 1 cleared the lip
  const present = useSharedValue(0); // 0 at slot size → 1 in front of the viewer
  const swapped = useSharedValue(0); // which copy is visible
  const burst = useSharedValue(0); // confetti clock
  const seal = useSharedValue(0); // shield stamp
  const motor = useSharedValue(0); // linear clock of the feed, drives the rumble

  const [runKey, setRunKey] = useState(0);

  const landed = useCallback(() => {
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
    callbacks.current.onPresented?.();
  }, []);

  const tick = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const rumble = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  }, []);

  useEffect(() => {
    const values = [feed, drop, present, swapped, burst, seal, motor];
    values.forEach((v) => cancelAnimation(v));
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (shouldAnimate || runKey > 0) callbacks.current.onPrintStart?.();

    if (reduceMotion || (!shouldAnimate && runKey === 0)) {
      feed.set(1);
      drop.set(1);
      swapped.set(1);
      present.set(1);
      seal.set(1);
      burst.set(0);
      callbacks.current.onPresented?.();
      return;
    }

    values.forEach((v) => {
      v.set(0);
    });
    const dropAt = START_DELAY_MS + FEED_MS;
    const presentAt = dropAt + DROP_MS;

    tick();
    motor.set(
      withDelay(
        START_DELAY_MS,
        withTiming(1, { duration: FEED_MS, easing: Easing.linear }),
      ),
    );
    for (let at = START_DELAY_MS; at < dropAt; at += RUMBLE_TICK_MS) {
      timers.push(setTimeout(rumble, at));
    }
    feed.set(
      withDelay(
        START_DELAY_MS,
        withTiming(1, {
          duration: FEED_MS,
          easing: Easing.bezier(0.3, 0.05, 0.4, 1),
        }),
      ),
    );
    drop.set(
      withDelay(
        dropAt,
        withTiming(1, { duration: DROP_MS, easing: Easing.in(Easing.quad) }),
      ),
    );
    swapped.set(withDelay(presentAt, withTiming(1, { duration: 0 })));
    present.set(
      withDelay(
        presentAt,
        withSpring(1, { damping: 14, stiffness: 120, mass: 0.9 }, (done) => {
          if (done) scheduleOnRN(landed);
        }),
      ),
    );
    seal.set(
      withDelay(presentAt + 380, withSpring(1, { damping: 9, stiffness: 180 })),
    );
    burst.set(
      withDelay(
        presentAt + 240,
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 1700, easing: Easing.linear }),
        ),
      ),
    );
    return () => {
      timers.forEach(clearTimeout);
      values.forEach((value) => cancelAnimation(value));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, reduceMotion]);

  /**
   * The machine shakes while it prints, and gives one small jolt as the paper
   * tears. All three layers move together, so the mouth keeps masking the paper.
   */
  const rumbleStyle = useAnimatedStyle(() => {
    const m = motor.get();
    if (m > 0 && m < 1) {
      const t = (m * FEED_MS) / 1000;
      const env = Math.min(1, m * 8, (1 - m) * 8); // ease in and out of the rumble
      return {
        transform: [
          { translateX: Math.sin(t * Math.PI * 2 * 23) * RUMBLE_PX * env },
          {
            translateY:
              Math.sin(t * Math.PI * 2 * 31 + 1) * RUMBLE_PX * 0.7 * env,
          },
          { rotate: `${Math.sin(t * Math.PI * 2 * 17) * RUMBLE_DEG * env}deg` },
        ],
      };
    }
    const jolt =
      drop.get() > 0 && drop.get() < 1 ? Math.sin(drop.get() * Math.PI) : 0;
    return {
      transform: [
        { translateX: 0 },
        { translateY: jolt * 1.6 },
        { rotate: `${-jolt * 0.6}deg` },
      ],
    };
  });

  /** The copy behind the render: prints out of the mouth, then drops. */
  const fedStyle = useAnimatedStyle(() => ({
    opacity: swapped.get() > 0.5 ? 0 : 1,
    transform: [
      { translateX: slotCenter - TICKET_W / 2 },
      { translateY: slotTop - clipTop },
      // Tilted like the mouth, with a tiny tremble while the printer feeds.
      {
        rotate: `${MOUTH_TILT + (feed.get() > 0 && feed.get() < 1 ? Math.sin(feed.get() * 60) * 0.6 : 0)}deg`,
      },
      // After the rotation, so the paper slides along the mouth's axis.
      { translateY: -fedH * (1 - feed.get()) + dropBy * drop.get() },
      { scale: feedScale },
    ],
  }));

  /** The copy in front: starts exactly where the fed copy left off. */
  const presentStyle = useAnimatedStyle(() => {
    const p = present.get();
    return {
      opacity: swapped.get() > 0.5 ? 1 : 0,
      transform: [
        {
          translateX:
            interpolate(p, [0, 1], [freedX, finalCenter]) - TICKET_W / 2,
        },
        { translateY: interpolate(p, [0, 1], [freedY, finalTop]) },
        // Leaves at the mouth's tilt and swings toward hanging; the spring's
        // overshoot is the sway.
        { rotate: `${interpolate(p, [0, 1], [MOUTH_TILT, HANG_TILT])}deg` },
        { scale: interpolate(p, [0, 1], [feedScale, finalScale]) },
      ],
    };
  });

  return (
    <Pressable
      disabled={!replayOnPress}
      onPress={() => setRunKey((k) => k + 1)}
      accessibilityRole="image"
      accessibilityLabel={`Tu turno reservado. ${formatted} en tu mano.`}
      style={{ width, height: stageH }}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, rumbleStyle]}
      >
        {/* Back: the whole machine, mouth interior and lower lip included. */}
        <Image
          source={DISPENSER}
          style={renderFrame}
          contentFit="contain"
          accessible={false}
        />

        <Image source={GLASS} style={renderFrame} contentFit="contain" accessible={false} />
        <Image source={MOUTH} style={renderFrame} contentFit="contain" accessible={false} />

        {v19Motion && <PaperRoll clock={motor} frame={{ left: slotCenter - dispW * 0.065,
          top: slotTop - dispW * 0.015, width: dispW * 0.13, height: dispW * 0.055 }} />}
        {/* Middle: the ticket while it is still coming out. */}
        <View
          pointerEvents="none"
          style={[
            styles.feedClip,
            { top: clipTop, width, height: stageH - clipTop },
          ]}
        >
          <Animated.View style={[styles.ticketOrigin, fedStyle]}>
            <Ticket amount={formatted} seal={seal} pulse={v19Motion} />
          </Animated.View>
        </View>

        {/* Front: the upper rim and body, so the paper slides out from under them. */}
        <Image
          source={DISPENSER_FRONT}
          style={renderFrame}
          contentFit="contain"
          accessible={false}
        />
      </Animated.View>

      {/* On top: the ticket once it is out, in front of everything. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.ticketOrigin, presentStyle]}
      >
        <Ticket amount={formatted} seal={seal} pulse={v19Motion} />
      </Animated.View>

      {confettiMode === 'rain' ? (
        <ConfettiRain width={width} height={stageH} />
      ) : (
        <View
          pointerEvents="none"
          style={[
            styles.confettiOrigin,
            { left: finalCenter, top: finalTop + 40 },
          ]}
        >
          {CONFETTI.map((piece, i) => (
            <ConfettiPiece key={i} piece={piece} clock={burst} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

/** Independently driven paper cylinder, masked by the machine's mouth. */
function PaperRoll({ clock, frame }: { clock: SharedValue<number>;
  frame: { left: number; top: number; width: number; height: number } }) {
  const motion = useAnimatedStyle(() => ({ opacity: clock.get() > 0 && clock.get() < 1 ? 1 : 0,
    transform: [{ rotateX: `${clock.get() * 1080}deg` }],
  }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', ...frame,
    borderRadius: frame.height / 2, backgroundColor: '#F1F3F8', overflow: 'hidden' }, motion]}>
    <View style={{ position: 'absolute', left: 0, right: 0, top: frame.height * 0.45,
      height: 1, backgroundColor: '#B7C0D0' }} />
  </Animated.View>;
}

/** The ticket at its design size (TICKET_W × TICKET_H). Shapes in SVG, copy in app Text. */
function Ticket({
  amount,
  seal,
  pulse = false,
}: {
  amount: string;
  seal: SharedValue<number>;
  pulse?: boolean;
}) {
  const reduced = useReducedMotion();
  const reservedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse && !reduced ? 1 + Math.sin(Math.min(1, seal.get()) * Math.PI) * 0.06 : 1 }],
  }));
  const sealStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, seal.get() * 2),
    transform: [
      { scale: interpolate(seal.get(), [0, 1], [1.8, 1]) },
      { rotate: `${interpolate(seal.get(), [0, 1], [-18, 0])}deg` },
    ],
  }));

  return (
    <View style={styles.ticket}>
      <Svg
        width={TICKET_W}
        height={TICKET_H}
        viewBox={`0 0 ${TICKET_W} ${TICKET_H}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E9ECF3" />
            <Stop offset="0.08" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#F6F7FA" />
          </LinearGradient>
        </Defs>
        <Path
          d={paperPath()}
          fill="url(#paper)"
          stroke="#D3D9E6"
          strokeWidth={1}
        />
        {/* The top edge where the paper was cut from the roll. */}
        <Rect x={0} y={0} width={TICKET_W} height={3} fill="#CBD2E1" />
        <Line
          x1={22}
          y1={130}
          x2={TICKET_W - 22}
          y2={130}
          stroke="#B9C1D6"
          strokeWidth={1.4}
          strokeDasharray="4 5"
          strokeLinecap="round"
        />
      </Svg>

      <Text style={styles.kicker}>TU TURNO</Text>
      <Animated.View style={[styles.seal, sealStyle]}>
        <ShieldCheck />
      </Animated.View>
      <Animated.View style={reservedStyle}><Text style={styles.reserved}>RESERVADO</Text></Animated.View>
      <Text
        style={styles.amount}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {amount}
      </Text>
      <Text style={styles.inHand}>en tu mano</Text>
    </View>
  );
}

function ShieldCheck() {
  return (
    <Svg width={34} height={38} viewBox="0 0 34 38">
      <Path
        d="M17 1.5 L31 6.5 V17.5 C31 26.5 25 33 17 36.5 C9 33 3 26.5 3 17.5 V6.5 Z"
        fill={SUCCESS}
      />
      <Path
        d="M17 1.5 L31 6.5 V17.5 C31 26.5 25 33 17 36.5 Z"
        fill="#000"
        opacity={0.08}
      />
      <Path
        d="M10.5 18.5 L15.2 23.2 L24 13.8"
        stroke="#FFFFFF"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Rectangle with a zigzag tear along the bottom. */
function paperPath(): string {
  const tooth = TICKET_W / TEETH;
  let d = `M0 0 H${TICKET_W} V${BODY_H}`;
  for (let i = TEETH; i > 0; i -= 1) {
    const x = i * tooth;
    d += ` L${x - tooth / 2} ${TICKET_H} L${x - tooth} ${BODY_H}`;
  }
  return `${d} Z`;
}

/** One shared UI clock drives staggered falling pieces, without per-frame React work. */
function ConfettiRain({ width, height }: { width: number; height: number }) {
  const reduceMotion = useReducedMotion();
  const clock = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    const resume = () => {
      cancelAnimation(clock);
      clock.set(0);
      clock.set(
        withRepeat(
          withTiming(1, { duration: 5800, easing: Easing.linear }),
          -1,
          false,
        ),
      );
    };
    if (
      AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive'
    )
      resume();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') resume();
      else cancelAnimation(clock);
    });
    return () => {
      subscription.remove();
      cancelAnimation(clock);
    };
  }, [clock, reduceMotion]);
  if (reduceMotion) return null;
  return (
    <View
      testID="closing-confetti-rain"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      {CONFETTI.map((piece, index) => (
        <RainPiece
          key={index}
          piece={piece}
          index={index}
          clock={clock}
          width={width}
          height={height}
        />
      ))}
    </View>
  );
}
function RainPiece({
  piece,
  index,
  clock,
  width,
  height,
}: {
  piece: (typeof CONFETTI)[number];
  index: number;
  clock: SharedValue<number>;
  width: number;
  height: number;
}) {
  const motion = useAnimatedStyle(() => {
    const phase = (clock.get() + index / CONFETTI.length) % 1;
    return {
      opacity: 0.88,
      transform: [
        {
          translateX:
            (((index * 83) % 100) / 100) * (width - 12) +
            Math.sin(phase * Math.PI * 2 + index) * 9,
        },
        { translateY: -20 + phase * (height + 40) },
        { rotate: `${phase * (index % 2 ? 540 : -540) + index * 37}deg` },
      ],
    };
  });
  return (
    <Animated.View
      testID={`confetti-rain-piece-${index}`}
      style={[
        styles.confetti,
        { width: piece.w, height: piece.h, backgroundColor: piece.color },
        motion,
      ]}
    />
  );
}

function ConfettiPiece({
  piece,
  clock,
}: {
  piece: (typeof CONFETTI)[number];
  clock: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const c = clock.get();
    if (c <= 0 || c >= 1) return { opacity: 0 };
    const t = c * 1.7; // seconds into the burst
    return {
      opacity: c < 0.7 ? 1 : 1 - (c - 0.7) / 0.3,
      transform: [
        { translateX: piece.vx * t },
        { translateY: piece.vy * t + 0.5 * 560 * t * t },
        { rotate: `${piece.spin * t}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.confetti,
        { width: piece.w, height: piece.h, backgroundColor: piece.color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ticketOrigin: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TICKET_W,
    height: TICKET_H,
    transformOrigin: 'top center',
  },
  feedClip: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
  },
  ticket: {
    width: TICKET_W,
    height: TICKET_H,
    alignItems: 'center',
    paddingTop: 20,
  },
  kicker: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 3,
    color: INK_SOFT,
  },
  seal: {
    marginTop: 10,
    width: 34,
    height: 38,
  },
  reserved: {
    marginTop: 8,
    fontFamily: fontFamily.bold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: 3.2,
    color: INK,
  },
  amount: {
    marginTop: 18,
    maxWidth: TICKET_W - 28,
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    color: INK,
  },
  inHand: {
    marginTop: 2,
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 19,
    color: SUCCESS,
  },
  confettiOrigin: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  confetti: {
    position: 'absolute',
    borderRadius: 1.5,
  },
});

/**
 * "La Tickera": the name the product team uses for this component. Upcoming
 * screen changes will place it by this name; see README.md in this folder.
 */
export const Tickera = TurnTicketDispenser;
export type TickeraProps = TurnTicketDispenserProps;
