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

/** Tiquera roja de «tu turno», con un tiquete vectorial que sale de la boca azul, se corta y avanza para poder leerlo.

La composición utiliza capas: el fondo conserva la máquina completa, el tiquete se imprime entre las capas y el frente oculta el papel que todavía está dentro. El frente incluye el borde superior y su sombra suave.

La boca ocupa aproximadamente el 14 % del ancho del dibujo. El papel se imprime al tamaño de la ranura, cae fuera de la boca y una segunda copia aumenta su tamaño delante de la máquina. El avance conserva la percepción de profundidad y permite leer el tiquete en el teléfono. */

const DISPENSER = require('../../../assets/brand/layers/cuerpo.png');
const GLASS = require('../../../assets/brand/layers/vidrio.png');
const MOUTH = require('../../../assets/brand/layers/boca.png');
const DISPENSER_FRONT = require('../../../assets/brand/turn-dispenser-front.webp');

/** Tamaño del dibujo original; las coordenadas de la ranura se expresan como fracciones de este tamaño. */
const SRC_W = 1371;
const SRC_H = 1148;
/** Recorrido del papel dentro de la boca, medido sobre la imagen original de 1371 × 1148. */
const SLOT = {
  /** Ancho del papel en la ranura, desplazado a la izquierda del centro. El eje inclinado mueve el papel unos 0,24 px a la derecha por cada píxel de descenso. Su borde derecho debe evitar la pared interna de la boca (x ≈ 1170 en el frente) hasta superar el labio. */
  left: 948 / SRC_W,
  right: 1138 / SRC_W,
  /** Centro del borde superior del papel (x ≈ 1043), justo sobre el borde interior (≈ 874), oculto bajo este. */
  top: 858 / SRC_H,
  /** Distancia que recorre el papel después de imprimirse para que todo su borde superior supere el labio. La esquina derecha baja hasta aproximadamente 885; la capa frontal no debe superponerse al intercambiar las copias. */
  drop: 60 / SRC_H,
  /** Parte superior del borde oscuro sobre la salida del papel. La imagen es transparente por encima de este límite, donde se recorta el papel que espera dentro. */
  housing: 770 / SRC_H,
  /** Punto más bajo del labio azul; el papel debe superarlo antes del intercambio. */
  lip: 984 / SRC_H,
};

/** La boca está inclinada: el borde sube 35 px en un recorrido de 140 px hacia la derecha (unos 14°). El papel se imprime sobre ese eje y luego se endereza al colgar. */
const MOUTH_TILT = -14;
const HANG_TILT = -3;
const TILT_RAD = (MOUTH_TILT * Math.PI) / 180;
/** Dirección descendente del papel en pantalla, perpendicular al borde inclinado. */
const FEED_AXIS = { x: -Math.sin(TILT_RAD), y: Math.cos(TILT_RAD) };

/** Coordenadas propias del tiquete, según su tamaño de diseño a escala completa. */
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
/** Vibración del motor al imprimir: pequeña, rápida e irregular, sin balanceo. */
const RUMBLE_PX = 0.9;
const RUMBLE_DEG = 0.35;
/** Pulsos hápticos mientras avanza el papel; solo se utilizan en la versión nativa. */
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
  /** Ancho de la escena en puntos; el dibujo y el tiquete se escalan a partir de este. */
  width?: number;
  country?: 'VE' | 'CO';
  /** El valor falso restaura la posición final al volver a una pantalla ya vista. */
  animateOnMount?: boolean;
  /** Se ejecuta al comenzar la impresión inicial, incluso con movimiento reducido. */
  onPrintStart?: () => void;
  /** Importe del tiquete. Usa de forma predeterminada el importe de demostración del país. */
  amount?: number;
  /** Cada pantalla de país puede proporcionar su formato de importe aprobado. */
  formattedAmount?: string;
  /** Ajuste horizontal de la posición final para respetar la composición aprobada. */
  ticketLandingOffsetX?: number;
  /** Una pulsación repite la impresión, útil en demostraciones. */
  replayOnPress?: boolean;
  /** Se ejecuta cuando el tiquete llega a su posición frente al usuario. */
  onPresented?: () => void;
  /** Celebración continua al cerrar el paseo; las demás pantallas conservan una sola ráfaga. */
  confettiMode?: 'burst' | 'rain';
  /** Coreografía aprobada de la v19 para el rollo y la palabra «reservado». */
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

  // Geometría de la escena derivada de su ancho.
  // El dibujo se desplaza a la izquierda para que la boca quede a la derecha del centro y el tiquete
  // que cuelga de ella permanezca dentro de la escena.
  const dispW = width * 0.94;
  const dispH = dispW * (SRC_H / SRC_W);
  const dispLeft = width * -0.1;
  /** Centro horizontal del recorrido del papel; ambas copias cuelgan de este punto. */
  const slotCenter = dispLeft + ((SLOT.left + SLOT.right) / 2) * dispW;
  const slotTop = SLOT.top * dispH;
  const lipY = SLOT.lip * dispH;
  const feedScale = ((SLOT.right - SLOT.left) * dispW) / TICKET_W;
  const fedH = TICKET_H * feedScale;
  /** Al completar la impresión, el borde superior sigue bajo el labio; esta caída lo libera. */
  const dropBy = SLOT.drop * dispH;
  /** Posición del centro superior después de caer; aquí comienza la copia frontal. */
  const freedX = slotCenter + FEED_AXIS.x * dropBy;
  const freedY = slotTop + FEED_AXIS.y * dropBy;

  // A tamaño completo, el tiquete cuelga del labio, centrado en la boca y contenido
  // dentro de la escena.
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

  const feed = useSharedValue(0); // 0 dentro de la boca → 1 completamente impreso
  const drop = useSharedValue(0); // 0 en reposo → 1 fuera del labio
  const present = useSharedValue(0); // 0 al tamaño de la ranura → 1 frente al usuario
  const swapped = useSharedValue(0); // copia visible
  const burst = useSharedValue(0); // reloj del confeti
  const seal = useSharedValue(0); // sello del escudo
  const motor = useSharedValue(0); // reloj lineal del avance que controla la vibración

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

  /** La máquina vibra al imprimir y da un pequeño impulso cuando se corta el papel. Las tres capas se mueven juntas para que la boca siga ocultando el papel interior. */
  const rumbleStyle = useAnimatedStyle(() => {
    const m = motor.get();
    if (m > 0 && m < 1) {
      const t = (m * FEED_MS) / 1000;
      const env = Math.min(1, m * 8, (1 - m) * 8); // entrada y salida suaves de la vibración
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

  /** La copia detrás del dibujo sale por la boca y luego cae. */
  const fedStyle = useAnimatedStyle(() => ({
    opacity: swapped.get() > 0.5 ? 0 : 1,
    transform: [
      { translateX: slotCenter - TICKET_W / 2 },
      { translateY: slotTop - clipTop },
      // Con la inclinación de la boca y una pequeña vibración mientras avanza la impresión.
      {
        rotate: `${MOUTH_TILT + (feed.get() > 0 && feed.get() < 1 ? Math.sin(feed.get() * 60) * 0.6 : 0)}deg`,
      },
      // Después de la rotación, el papel avanza por el eje de la boca.
      { translateY: -fedH * (1 - feed.get()) + dropBy * drop.get() },
      { scale: feedScale },
    ],
  }));

  /** La copia frontal comienza exactamente donde termina la copia impresa. */
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
        // Sale con la inclinación de la boca y oscila hasta quedar colgando; el exceso de recorrido
        // del resorte produce el balanceo.
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
        {/* Fondo: máquina completa, interior de la boca y labio inferior. */}
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
        {/* Capa intermedia: tiquete mientras sale de la máquina. */}
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

        {/* Frente: borde superior y cuerpo, que ocultan el papel mientras sale. */}
        <Image
          source={DISPENSER_FRONT}
          style={renderFrame}
          contentFit="contain"
          accessible={false}
        />
      </Animated.View>

      {/* Capa superior: tiquete fuera de la máquina, delante de los demás elementos. */}
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

/** Cilindro de papel con movimiento independiente, recortado por la boca de la máquina. */
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

/** Tiquete al tamaño de diseño (TICKET_W × TICKET_H). Las formas usan SVG y los textos el componente Text. */
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
        {/* Borde superior donde el papel se separa del rollo. */}
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

/** Rectángulo con un corte en zigzag en el borde inferior. */
function paperPath(): string {
  const tooth = TICKET_W / TEETH;
  let d = `M0 0 H${TICKET_W} V${BODY_H}`;
  for (let i = TEETH; i > 0; i -= 1) {
    const x = i * tooth;
    d += ` L${x - tooth / 2} ${TICKET_H} L${x - tooth} ${BODY_H}`;
  }
  return `${d} Z`;
}

/** Un reloj compartido de interfaz controla las piezas que caen de forma escalonada, sin trabajo de React en cada fotograma. */
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
    const t = c * 1.7; // segundos transcurridos de la ráfaga
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

/** «La Tickera» es el nombre que utiliza el equipo del producto para este componente. */
export const Tickera = TurnTicketDispenser;
export type TickeraProps = TurnTicketDispenserProps;
