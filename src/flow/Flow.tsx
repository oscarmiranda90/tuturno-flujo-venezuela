import React, { useEffect, useRef, useState, useId } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "../platform/storage";
import Animated, {
  Easing,
  useAnimatedStyle,
  useAnimatedProps,
  type SharedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Svg, {
  Circle,
  Defs,
  Mask,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import * as Notifications from "../platform/notifications";
import * as Haptics from "../platform/haptics";
import { StatusBar } from "../platform/statusBar";
import {
  RegistrationV3,
  type RegistrationServices,
} from "../screens/auth/RegistrationV3";
import { Tickera } from "../components/turn/TurnTicketDispenser";
import { TutuMascot } from "../components/TutuMascot";
import { useTutuAudio } from "../onboarding/tutuAudio";
import { requestNoticePermission } from "../platform/notifications";
import { v19Money as money } from "../domain/money";
import {
  ACKNOWLEDGEMENTS,
  C,
  GUARANTEE,
  IDEAS,
  PURPOSES,
  VOICE,
} from "./content";
import {
  PulseContext,
  At,
  Button,
  Card,
  Check,
  CircleIcon,
  Face,
  Frame,
  Header,
  Icon,
  T,
  illustration,
  useCanvasLayout,
} from "./ui";
import {
  AlertBox,
  Bubble,
  CalendarNote,
  Guarantee,
  NumberedTitle,
  PaperTicket,
  PeekingTutu,
} from "./pieces";
import { V19_VOICE_KEYS, type V19Voice } from "./voice";
import { horizontalRect } from "./layout";
import { Entrance, WheelConfetti } from "./motion";
import { PaymentHandoff } from "./PaymentHandoff";
import {WelcomeV20,HowV20,PracticeV20,VerificationV20} from "./v20";
import {
  initialState,
  restoreSan,
  paymentFailed,
  paymentTerms,
  previous,
  type FlowState,
  type Screen,
} from "./state";

export interface PaymentOrder {
  id: string;
  amount: number;
  bolivars: string;
  checkoutUrl: string;
}
export interface FlowServices {
  requestPaymentOrder?: (state: FlowState) => Promise<PaymentOrder>;
  scheduleReminders?: (state: FlowState) => Promise<void>;
  supportUrl?: string;
  onProfile?: () => void;
}
export interface VenezuelaFlowProps {
  initialScreen?: Screen;
  savedSan?: unknown;
  savedReferral?: string | null;
  initialVariant?:
    "base" | "guide" | "guide2" | "guide3" | "ready" | "other" | "wheel7" | "selected";
  review?: boolean;
  registrationServices?: RegistrationServices;
  services?: FlowServices;
  onState?: (state: FlowState) => void;
  onAudio?: (audio: ReturnType<typeof useTutuAudio>) => void;
  onExit?: () => void;
  onPaidLogin?: () => void;
}
const touch = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
const STORAGE = "tuturno.v20.demo.san";
const sheet = (top: number) =>
  ({
    left: 12,
    top,
    width: 336,
    height: 788 - top,
    backgroundColor: "white",
    borderRadius: 28,
  }) as const;

export function VenezuelaFlow({
  initialScreen = "4a",
  savedSan,
  savedReferral,
  initialVariant,
  review = false,
  registrationServices,
  services,
  onState,
  onAudio,
  onExit,
  onPaidLogin,
}: VenezuelaFlowProps) {
  const [s, setS] = useState<FlowState>(() => ({
    ...(savedSan
      ? restoreSan(savedSan, initialScreen)
      : initialState(initialScreen)),
    ...(initialVariant === "other" ? { idea: 5 as const } : initialVariant === "selected" ? { idea: 0 as const } : {}),
    wheel: initialVariant === "wheel7" ? 7 : null,
    rule:
      initialVariant === "wheel7" || initialVariant === "guide3"
        ? 2
        : initialVariant === "guide2"
          ? 1
          : 0,
  }));
  const [reacting, setReacting] = useState(initialVariant === "selected");
  const [practiceCompleted, setPracticeCompleted] = useState(!!initialVariant);
  const [practiceReady, setPracticeReady] = useState(initialVariant === "base");
  const [guided, setGuided] = useState(!!initialVariant?.startsWith("guide"));
  const [verificationReady, setVerificationReady] = useState(
    initialVariant === "ready",
  );
  const [notice, setNotice] = useState<"unanswered" | "granted" | "declined">(
    "unanswered",
  );
  const [replay, setReplay] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [pushCount, setPushCount] = useState(0);
  const [referral, setReferral] = useState<string | null>(
    review && ["12", "12c", "12d"].includes(initialScreen)
      ? "María Pérez"
      : (savedReferral ?? null),
  );
  const [referralSheet, setReferralSheet] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [termsProgress, setTermsProgress] = useState(
    initialScreen === "11b" ? 100 : 15,
  );
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState(false);
  const reduce = useReducedMotion();
  const audio = useTutuAudio();
  const audioRef = useRef(audio);
  audioRef.current = audio;
  const terms = paymentTerms(s.frequency);
  useEffect(() => {
    if (review || Platform.OS === "web") return;
    let mounted = true;
    void Notifications.getPermissionsAsync()
      .then((permission) => {
        if (!mounted) return;
        setNotice(
          permission.granted
            ? "granted"
            : !permission.canAskAgain ||
                (Platform.OS === "android" && Number(Platform.Version) < 33)
              ? "declined"
              : "unanswered",
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [review]);

  const move = (screen: Screen) => {
    audio.stop();
    setReturning(false);
    setS((v) => ({ ...v, screen, rule: ["4c", "6"].includes(screen) ? 0 : v.rule }));
  };
  const goBack = () => {
    audio.stop();
    setReturning(true);
    setGuided(false);
    setVerificationReady(true);
    setS(previous);
  };
  const stage = s.screen;
  const spotlightVisible = guided && ["4c", "5", "6", "7", "7b", "8"].includes(stage);
  const voice =
    stage === "6" ? `6-${s.rule + 1}` : stage === "4c" ? `4c-${s.rule + 1}` : stage === "11b" ? "11" : stage;
  const matchedVoice = V19_VOICE_KEYS[voice as V19Voice] ?? null;
  useEffect(() => {
    onState?.(s);
  }, [s, onState]);
  useEffect(() => {
    onAudio?.(audio);
  }, [
    onAudio,
    audio.audioKey,
    audio.muted,
    audio.playing,
    audio.blocked,
    audio.error,
  ]);
  useEffect(() => {
    if(typeof location !== "undefined" && location.pathname === "/catalog") return;
    void AsyncStorage.setItem(
      STORAGE,
      JSON.stringify({ ...s, order, referral }),
    ).catch(() => {});
  }, [s, order, referral, review]);
  useEffect(() => {
    setGuided(!!initialVariant?.startsWith("guide"));
    const guidedScreen = ["4c", "5", "6", "7", "7b", "8"].includes(stage);
    if (returning) {
      setGuided(guidedScreen && stage !== "8");
      return;
    }
    if (
      !guidedScreen ||
      initialVariant === "base" ||
      initialVariant === "ready"
    )
      return;
    if (stage === "7b" && !practiceCompleted) return;
    if (reduce) {
      setVerificationReady(true);
      setGuided(true);
      return;
    }
    if (!!initialVariant?.startsWith("guide")) return;
    const timer = setTimeout(() => setGuided(true), 1000);
    return () => clearTimeout(timer);
  }, [stage, returning, initialVariant, reduce, practiceCompleted]);
  useEffect(() => {
    const shouldSpeak = ["4b", "9", "10", "11"].includes(voice) || guided || (stage === "4a" && reacting);
    // La narración utiliza la voz aprobada y los textos correspondientes de la guía.
    audioRef.current.select(shouldSpeak ? matchedVoice : null);
    return () => audioRef.current.stopVoice();
  }, [voice, guided, matchedVoice, reacting]);
  const support = () => {
    if (services?.supportUrl)
      void Linking.openURL(services.supportUrl).catch(() =>
        Alert.alert("No pudimos abrir WhatsApp", "Inténtalo de nuevo."),
      );
    else if (review)
      Alert.alert(
        "WhatsApp",
        "La atención se abre desde la app con el número configurado.",
      );
  };
  const chooseIdea = async (index: number) => {
    if (reacting) return;
    touch();
    setS((v) => ({ ...v, idea: index as FlowState["idea"] }));
    setReacting(true);
    setTimeout(() => { setReacting(false); move(notice === "unanswered" ? "4b" : "4c"); }, 1500);
  };
  const decide = async (accept: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      setNotice(review ? "declined" : await requestNoticePermission(accept));
      move("4c");
    } finally {
      setBusy(false);
    }
  };
  const advanceGuide = () => {
    if (stage === "4c" && s.rule < 2) { touch(); setS(v=>({...v,rule:(v.rule+1) as 1|2})); }
    else if (stage === "4c") move("5");
    else if (stage === "5") move("6");
    else if (stage === "6" && s.rule < 2) {
      touch();
      setS((v) => ({ ...v, rule: (v.rule + 1) as 1 | 2 }));
    } else if (stage === "6") {
      setGuided(false);
    } else if (stage === "7") {
      setPracticeReady(true);
      setGuided(false);
    } else if (stage === "7b") move("8");
    else if (stage === "8") {
      setGuided(false);
      setVerificationReady(true);
      touch();
    }
  };
  const pay = async () => {
    if (busy) return;
    if (review) {
      move("13");
      return;
    }
    if (!services?.requestPaymentOrder) {
      Alert.alert("Pago no disponible", "Inténtalo de nuevo más tarde.");
      return;
    }
    setBusy(true);
    try {
      const result = await services.requestPaymentOrder(s);
      if (
        !Number.isFinite(result.amount) ||
        Math.abs(result.amount - terms.total) > 0.005 ||
        !/^https:\/\//.test(result.checkoutUrl)
      )
        throw new Error("Orden del proveedor de pagos inválida");
      setOrder(result);
      await Linking.openURL(result.checkoutUrl);
    } catch {
      setS(paymentFailed);
    } finally {
      setBusy(false);
    }
  };
  const reminder = async () => {
    if (!review) {
      if (!services?.scheduleReminders) {
        Alert.alert(
          "Recordatorio no disponible",
          "Inténtalo de nuevo más tarde.",
        );
        return;
      }
      const permission = await requestNoticePermission(true);
      if (permission !== "granted") {
        Alert.alert(
          "Activa los avisos",
          "Necesitamos tu permiso para recordarte este San.",
        );
        return;
      }
      try {
        await services.scheduleReminders(s);
      } catch {
        Alert.alert(
          "No pudimos guardar el recordatorio",
          "Inténtalo de nuevo.",
        );
        return;
      }
    }
    move("12d");
  };
  if (["1", "2", "3"].includes(stage)) {
    const registration = (
      <RegistrationV3
        edition="v19"
        referenceKeyboard={review && Platform.OS === "web" && !(typeof location !== "undefined" && new URLSearchParams(location.search).get("android") === "1")}
        initialCountry="VE"
        initialEmail={review && stage === "2" ? "nuevo@ejemplo.com" : ""}
        initialPreview={
          stage === "2"
            ? "otp"
            : stage === "3"
              ? "pin"
              : review
                ? "start"
                : undefined
        }
        services={registrationServices}
        onComplete={() => move("4a")}
        onPaidLogin={onPaidLogin}
      />
    );
    return Platform.OS === "web" ? (
      <Frame review={review} darkIndicator={stage === "2"}>
        {stage === "1" && (
          <At
            x={0}
            y={0}
            w={360}
            h={28}
            style={{ backgroundColor: "#0B175E" }}
          />
        )}
        <At x={0} y={28} w={360} h={772} fillToBottom>
          {registration}
        </At>
      </Frame>
    ) : (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        {registration}
      </View>
    );
  }
  const real = ["10", "11", "11b", "12", "12c", "12d", "13"].includes(stage);
  const progress = real
    ? stage === "10"
      ? 1
      : stage.startsWith("11")
        ? 2
        : 3
    : stage.startsWith("4")
      ? 1
      : stage === "5"
        ? 2
        : stage === "6"
          ? 3
          : stage === "7"
            ? 4
            : stage === "7b"
              ? 5
              : 6;
  const title: Partial<Record<Screen, string>> = {
    "4c": "Así funciona TuTurno",
    "4b": "Así funciona TuTurno",
    "5": "Así pagas tu San",
    "6": "Las reglas de tu San",
    "7": "Practica tu primer pago",
    "7b": "Practica tu primer pago",
    "8": "Aquí todos están verificados",
    "9": "¡Ya sabes cómo cobrar tus €100!",
    "10": "Escoge tu San",
    "11": "Lo que aceptas",
    "11b": "Lo que aceptas",
    "12": "Tu primer pago",
    "12c": "Tu primer pago",
    "12d": "Tu primer pago",
  };
  const focus =
    stage === "4c"
      ? {x:24,y:138+s.rule*162,w:312,h:150}
      : stage === "5"
      ? { x: 22, y: 138, w: 316, h: 535 }
      : stage === "6"
        ? [
            { x: 24, y: 134, w: 312, h: 232 },
            { x: 24, y: 378, w: 312, h: 125 },
            { x: 24, y: 514, w: 312, h: 196 },
          ][s.rule]
        : stage === "8"
          ? { x: 24, y: 169, w: 312, h: 499 }
          : { x: 24, y: 134, w: 312, h: 536 };
  const bubbleY =
    stage === "4c" ? 636 : stage === "6" ? [384, 520, 421][s.rule] : stage === "5" ? 692 : 699;
  const overlays = (
    <>
      {stage === "4b" && (
        <>
          <At
            w={360}
            h={800}
            fill
            style={{ backgroundColor: C.veil, opacity: 0.66 }}
          />
          <At x={0} y={486} anchor="bottom" w={360} h={314}>
            <Entrance
              distance={314}
              duration={420}
              style={{
                flex: 1,
                backgroundColor: "white",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
              }}
            >
              <At
                x={160}
                y={10}
                w={40}
                h={4}
                style={{ backgroundColor: "#D4DBE7", borderRadius: 3 }}
              />
              <At x={16} y={28}>
                <TutuMascot mood="idle" size={100} idleVariant="one" />
              </At>
              <At
                x={126}
                y={36}
                w={212}
                h={120}
                style={{
                  backgroundColor: C.bubble,
                  borderRadius: 20,
                  padding: 13,
                }}
              >
                <T size={18} weight={800}>
                  {VOICE["4b"][0]}
                </T>
                <T size={14} style={{ marginTop: 5 }}>
                  {VOICE["4b"][1]}
                </T>
                <At x={196} y={-8} w={24} h={24}>
                  <Pressable
                    onPress={audio.toggle}
                    accessibilityRole="button"
                    accessibilityLabel={
                      audio.muted
                        ? "Activar voz de Tutu"
                        : "Silenciar voz de Tutu"
                    }
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      backgroundColor: C.blue,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={audio.muted ? "speaker-off" : "speaker"}
                      color="white"
                      size={16}
                    />
                  </Pressable>
                </At>
              </At>
              <Button
                label="Sí, avísame"
                y={170}
                onPress={() => void decide(true)}
                disabled={busy}
              />
              <At x={100} y={244} w={160} h={30}>
                <Pressable
                  onPress={() => void decide(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Ahora no"
                >
                  <T
                    size={15}
                    weight={600}
                    color="#5B6581"
                    style={{ textAlign: "center" }}
                  >
                    Ahora no
                  </T>
                </Pressable>
              </At>
            </Entrance>
          </At>
        </>
      )}
      {stage === "12d" && (
        <>
          <At
            w={360}
            h={800}
            fill
            style={{ backgroundColor: C.veil, opacity: 0.66 }}
          />
          <At x={0} y={520} anchor="bottom" w={360} h={280}>
            <Entrance
              distance={280}
              duration={420}
              style={{
                flex: 1,
                backgroundColor: "white",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
              }}
            >
              <At
                x={160}
                y={10}
                w={40}
                h={4}
                style={{ backgroundColor: "#D4DBE7", borderRadius: 3 }}
              />
              <At x={152} y={32} w={56} h={56}>
                <CircleIcon name="bell" size={56} />
                <At x={37} y={38}>
                  <Check size={22} />
                </At>
              </At>
              <At x={20} y={104} w={320}>
                <T size={23} weight={800} style={{ textAlign: "center" }}>
                  Listo, te avisamos
                </T>
                <T
                  size={14}
                  color="#5C6682"
                  style={{ textAlign: "center", marginTop: 9 }}
                >
                  Tu San queda guardado.{`\n`}El viernes te recordamos para que
                  arranques.
                </T>
              </At>
              <Button label="Entendido" y={201} onPress={() => move("12")} />
            </Entrance>
          </At>
        </>
      )}
      {referralSheet && (
        <>
          <At
            w={360}
            h={800}
            fill
            style={{ backgroundColor: C.veil, opacity: 0.66 }}
          />
          <At
            x={0}
            y={500}
            anchor="bottom"
            w={360}
            h={300}
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 25,
            }}
          >
            <T size={22} weight={800}>
              ¿Te invitaron?
            </T>
            <T style={{ marginTop: 8 }}>Coloca tu código de invitación.</T>
            <TextInput
              value={referralCode}
              onChangeText={setReferralCode}
              placeholder="Código de invitación"
              accessibilityLabel="Código de invitación"
              autoCapitalize="characters"
              style={{
                height: 52,
                borderWidth: 1,
                borderColor: "#DCE1EE",
                borderRadius: 14,
                padding: 12,
                marginTop: 18,
                fontFamily: "Outfit_500Medium",
              }}
            />
            <Button
              label="Guardar código"
              y={173}
              disabled={!referralCode.trim()}
              onPress={() => {
                setReferral(review ? "María Pérez" : referralCode);
                setReferralSheet(false);
              }}
            />
            <At x={80} y={245} w={200}>
              <Pressable onPress={() => setReferralSheet(false)}>
                <T style={{ textAlign: "center" }}>Más tarde</T>
              </Pressable>
            </At>
          </At>
        </>
      )}
    </>
  );
  if (stage === "13") return <PaymentHandoff onBack={() => move("12")} onFailed={review ? () => setS(paymentFailed) : undefined} />;
  return (
    <PulseContext.Provider value={guided && !reduce ? focus : null}>
      <Frame
        review={review}
        sceneKey={stage}
        systemBarDim={spotlightVisible || stage === "4b" || stage === "12d" || referralSheet ? 0.66 : 0}
        overlay={
          stage === "4b" || stage === "12d" || referralSheet
            ? overlays
            : undefined
        }
      >
        <StatusBar style="light" />
        <Header
          title={stage === "9" ? undefined : title[stage]}
          progress={progress}
          onBack={stage === "4a" || stage === "4b" ? undefined : goBack}
          real={real}
          onSupport={support}
          onProfile={services?.onProfile}
          welcome={stage === "4a"}
          closing={stage === "9"}
          celebrate={stage === "7b"}
        />
        {stage === "4a" && <WelcomeV20 onToggle={audio.toggle} muted={audio.muted} idea={s.idea} reacting={reacting} onIdea={chooseIdea} showReferral={!referral} onReferral={()=>setReferralSheet(true)} />}
        {(stage === "4b" || stage === "4c") && <HowV20 />}
        {stage === "5" && (
          <>
            <At fillToBottom style={sheet(122)} />
            <Card x={22} y={138} w={316} h={535}>
              <At x={80} y={16} w={155} h={127}>
                <Image
                  source={illustration.account}
                  style={{ width: 155, height: 127 }}
                />
              </At>
              <At x={24} y={155} w={268}>
                <T size={26} weight={800} style={{ textAlign: "center" }}>
                  Pagas a una{`\n`}sola cuenta
                </T>
                <T
                  size={15}
                  color="#555F80"
                  style={{ textAlign: "center", marginTop: 8 }}
                >
                  La de TuTurno, con pago móvil.
                </T>
              </At>
              <At
                x={20}
                y={263}
                w={276}
                h={1}
                style={{
                  borderTopWidth: 1,
                  borderColor: "#E2E5EE",
                  borderStyle: "dashed",
                }}
              />
              <At x={20} y={286} w={276}>
                <T
                  size={17}
                  weight={700}
                  color="#424D70"
                  style={{ textAlign: "center" }}
                >
                  Cada semana pagas
                </T>
              </At>
              {[10, 1.74, 11.74].map((a, i) => (
                <At
                  key={a}
                  x={20 + i * 91}
                  y={316}
                  w={i === 2 ? 93 : 80}
                  h={86}
                  style={{
                    backgroundColor: i === 2 ? C.blue : "#F3F5FC",
                    ...(i === 2
                      ? {
                          shadowColor: C.blue,
                          shadowOpacity: 0.2,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 7 },
                        }
                      : {}),
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <T size={25} weight={800} color={i === 2 ? "white" : C.ink}>
                    {money(a)}
                  </T>
                  <T
                    size={13}
                    color={i === 2 ? "white" : "#555F80"}
                    style={{ marginTop: 5 }}
                  >
                    {["tu cuota", "garantía y\nservicio", "total"][i]}
                  </T>
                </At>
              ))}
              <At x={100} y={350}>
                <T size={20} color="#9098AD">
                  +
                </T>
              </At>
              <At x={191} y={350}>
                <T size={20} color="#9098AD">
                  =
                </T>
              </At>
              <At
                x={20}
                y={425}
                w={276}
                h={1}
                style={{
                  borderTopWidth: 1,
                  borderColor: "#E2E5EE",
                  borderStyle: "dashed",
                }}
              />
              <At
                x={20}
                y={447}
                w={276}
                h={66}
                style={{
                  backgroundColor: "#F3F5FC",
                  borderRadius: 18,
                  padding: 12,
                }}
              >
                <CalendarNote />
              </At>
            </Card>
          </>
        )}
        {stage === "6" && (
          <>
            <At fillToBottom style={sheet(122)} />
            <Card y={134} h={232}>
              <At x={14} y={15} w={284}>
                <NumberedTitle number={1}>Así cobras tu turno</NumberedTitle>
              </At>
              <At x={9} y={50} w={142} h={124}>
                <Image
                  source={illustration.group}
                  style={{ width: 142, height: 124 }}
                />
              </At>
              <At
                x={157}
                y={54}
                w={139}
                h={38}
                style={{
                  backgroundColor: C.green,
                  borderRadius: 25,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T size={16} weight={700}>
                  Cobras{" "}
                  <T size={23} weight={800}>
                    {money(100)}
                  </T>
                </T>
              </At>
              <At x={157} y={101} w={136}>
                <T size={13} color="#536080">
                  Te llegan completos a tu pago móvil.
                </T>
              </At>
              <At x={158} y={150} w={139}>
                <View style={{ flexDirection: "row", gap: 7 }}>
                  <Icon name="calendar" size={17} />
                  <T size={12} weight={600}>
                    Ese día también{`\n`}pagas tu cuota.
                  </T>
                </View>
              </At>
              <At
                x={14}
                y={185}
                w={282}
                h={32}
                style={{
                  borderRadius: 13,
                  backgroundColor: "#EEF2FF",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 11,
                  gap: 7,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#EC4A4E",
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    alignItems: "center",
                  }}
                >
                  <T color="white" size={13}>
                    ×
                  </T>
                </View>
                <T size={12} weight={700}>
                  No pagó →
                </T>
                <Icon name="covered-shield" size={22} />
                <T size={12} weight={700}>
                  TuTurno cubre
                </T>
              </At>
            </Card>
            <Card y={378} h={125}>
              <At x={14} y={16} w={282}>
                <NumberedTitle number={2}>
                  Si te retiras, pierdes{`\n`}lo que pagaste
                </NumberedTitle>
              </At>
              <At
                x={14}
                y={72}
                w={282}
                h={38}
                style={{
                  borderRadius: 12,
                  backgroundColor: "#EEF2FF",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 15,
                }}
              >
                <Icon name="shield-filled" size={18} />
                <T size={14} weight={600}>
                  Así tu grupo está protegido.
                </T>
              </At>
            </Card>
            <Card y={514} h={196} style={{ shadowOpacity: 0, elevation: 0 }}>
              <At x={14} y={14} w={282}>
                <NumberedTitle number={3}>Simula tu turno</NumberedTitle>
              </At>
              <At x={8} y={78}>
                <WheelTutu push={pushCount} />
              </At>
              <At x={76} y={51} w={123} h={123}>
                <PracticeWheel
                  onSpin={() => setPushCount((v) => v + 1)}
                  onResult={(n) => {
                    touch();
                    setS((v) => ({ ...v, wheel: n }));
                    setSpinCount((v) => v + 1);
                  }}
                  value={s.wheel}
                  reduce={reduce || returning}
                />
              </At>
              {spinCount > 0 && <WheelConfetti key={spinCount} />}
              <At x={233} y={64} w={81}>
                <T size={15} weight={800} style={{ letterSpacing: 2 }}>
                  TURNO
                </T>
                <T size={38} weight={800} color="#B7C0DB">
                  {s.wheel ?? "?"}
                </T>
                <T size={28}>☝</T>
              </At>
            </Card>
            {s.wheel !== null && !guided && (
              <Button label="Siguiente" y={725} onPress={() => move("7")} />
            )}
          </>
        )}
        {(stage === "7" || stage === "7b") && (
          <>
            <At fillToBottom style={sheet(122)} />
            <PracticeV20 paid={stage === "7b"} complete={!!initialVariant || returning || reduce} onComplete={()=>setPracticeCompleted(true)} />
            <At
              x={28}
              y={695}
              anchor="bottom"
              w={304}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <T size={15} color="#F1B700">
                ★★★★★
              </T>
              <T size={14} weight={800}>
                4,6
              </T>
              <T size={12} color="#566181">
                en las tiendas · +3.000 opiniones
              </T>
            </At>
            <Button
              label={stage === "7b" ? "Siguiente" : `Pagar ${money(11.74)}`}
              y={720}
              disabled={stage === "7" ? !practiceReady : !practiceCompleted}
              onPress={() => {
                touch();
                move(stage === "7" ? "7b" : "8");
              }}
            />
          </>
        )}
        {stage === "8" && <><VerificationV20 complete={!!initialVariant || returning || reduce} onComplete={()=>setVerificationReady(true)} /><Button label="Siguiente" y={718} disabled={!verificationReady} onPress={()=>move("9")} /></>}
        {stage === "9" && (
          <>
            <At x={35} y={80} w={310}>
              <T size={20} weight={800} color="white">
                ¡Ya sabes cómo cobrar tus €100!
              </T>
            </At>
            <At fillToBottom style={sheet(111)} />
            <At x={197} y={121} w={143} h={39}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Repetir animación"
                onPress={() => {
                  setReplay((v) => v + 1);
                  if (!audio.muted) audio.replay();
                }}
                style={{
                  flex: 1,
                  borderRadius: 22,
                  backgroundColor: "#EEEFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T size={12} weight={800}>
                  ↻ Repetir animación
                </T>
              </Pressable>
            </At>
            <At x={59} y={157} w={242} h={420}>
              <Tickera
                key={replay}
                width={242}
                ticketLandingOffsetX={-23}
                formattedAmount={money(100)}
                replayOnPress={false}
                animateOnMount={!returning}
                confettiMode="burst"
                v19Motion
                onPrintStart={audio.printer}
              />
              <At x={167} y={230}>
                <TutuMascot mood="dance" size={116} />
              </At>
            </At>
            <At x={74} y={629} anchor="bottom">
              <Guarantee small />
            </At>
            <Button
              label="Cobrar mi turno"
              arrow
              y={673}
              onPress={() => move("10")}
            />
            <At x={85} y={743} w={190} h={28} anchor="bottom">
              <Pressable
                onPress={() => {
                  setS(initialState());
                  setGuided(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Más tarde"
              >
                <T
                  size={15}
                  weight={600}
                  color="#5C6682"
                  style={{ textAlign: "center" }}
                >
                  Más tarde
                </T>
              </Pressable>
            </At>
          </>
        )}
        {stage === "10" && (
          <>
            <PeekingTutu
              text={VOICE["10"][0]}
              onToggle={audio.toggle}
              muted={audio.muted}
            />
            <At fillToBottom style={sheet(150)} />
            {PURPOSES[s.idea ?? 0] && <At
              x={41}
              y={167}
              w={278}
              style={{ flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" }}
            >
              <IdeaIcon idea={s.idea ?? 0} size={34} />
              <View style={{ flexShrink: 1 }}>
                <T size={18} weight={800}>
                  Cobras <T size={18} weight={800} color={C.money}>{money(100)}</T>
                </T>
                <T size={16} weight={700} color="#414C6D" style={{ marginTop: 3 }}>
                  para {PURPOSES[s.idea ?? 0]}
                </T>
              </View>
            </At>}
            <PlanCard
              y={PURPOSES[s.idea ?? 0] ? 225 : 165}
              fortnightly={false}
              onPress={() => {
                touch();
                setS((v) => ({ ...v, frequency: "weekly", screen: "11" }));
              }}
            />
            <PlanCard
              y={PURPOSES[s.idea ?? 0] ? 463 : 403}
              fortnightly
              onPress={() => {
                touch();
                setS((v) => ({ ...v, frequency: "fortnightly", screen: "11" }));
              }}
            />
            <At x={42} y={PURPOSES[s.idea ?? 0] ? 705 : 645} anchor="bottom">
              <Guarantee small boxed />
            </At>
          </>
        )}
        {(stage === "11" || stage === "11b") && (
          <>
            <PeekingTutu
              text={VOICE["11"][0]}
              onToggle={audio.toggle}
              muted={audio.muted}
            />
            <At fillToBottom style={sheet(150)} />
            <TermsPanel
              read={s.termsRead}
              progress={termsProgress}
              onRead={() => {
                setS((v) => ({ ...v, termsRead: true }));
                setTermsProgress(100);
              }}
              onProgress={setTermsProgress}
            />
            {ACKNOWLEDGEMENTS.map((label, i) => (
              <At
                key={label}
                x={28}
                y={[432, 556, 633][i]}
                w={304}
                h={[117, 70, 54][i]}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${String.fromCharCode(65 + i)}. ${label}`}
                  accessibilityState={{
                    disabled: !s.termsRead,
                    checked: s.accepted[i],
                  }}
                  disabled={!s.termsRead}
                  onPress={() => {
                    touch();
                    setS((v) => {
                      const accepted = [...v.accepted] as FlowState["accepted"];
                      accepted[i] = !accepted[i];
                      return { ...v, accepted };
                    });
                  }}
                  style={{
                    flex: 1,
                    borderRadius: 17,
                    borderWidth: 1,
                    borderColor: s.accepted[i] ? "#BFEAD6" : "#E0E3ED",
                    backgroundColor: s.accepted[i] ? "#F0FBF5" : "white",
                    padding: 12,
                    flexDirection: "row",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 21,
                      height: 21,
                      borderRadius: 6,
                      borderWidth: s.accepted[i] ? 0 : 2,
                      borderColor: "#D5DCE9",
                      backgroundColor: s.accepted[i] ? C.green : "white",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {s.accepted[i] && (
                      <Icon name="check" color="white" size={17} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <T
                      size={10.5}
                      weight={500}
                      style={{ fontFamily: "Inter", lineHeight: 15.5 }}
                      color={!s.termsRead ? "#9BA5BF" : C.ink}
                    >
                      {String.fromCharCode(65 + i)} · {label}
                    </T>
                  </View>
                </Pressable>
              </At>
            ))}
            <Button
              label="Acepto"
              arrow
              y={716}
              disabled={!s.termsRead || !s.accepted.every(Boolean)}
              onPress={() => move("12")}
            />
          </>
        )}
        {["12", "12c", "12d"].includes(stage) && (
          <>
            <At fillToBottom style={sheet(100)} />
            <RealPayment
              failed={stage === "12c"}
              idea={s.idea ?? 0}
              terms={terms}
              bolivars={order?.bolivars ?? (review && s.frequency === "weekly" ? "Bs 18.523,36" : null)}
              referral={referral}
              onPay={() => void pay()}
              onRemind={() => void reminder()}
              onSupport={support}
            />
          </>
        )}
        {spotlightVisible && (
          <>
            <Spotlight rect={focus} reduce={reduce} />
            <Bubble
              voice={voice as keyof typeof VOICE}
              y={bubbleY}
              nextY={stage === "4c" ? 712 : bubbleY + (stage === "6" && s.rule < 2 ? 45 : 23)}
              tail={stage === "6" && s.rule === 2 ? "bottom" : "top"}
              onNext={advanceGuide}
              onToggle={audio.toggle}
              muted={audio.muted}
            />
          </>
        )}
      </Frame>
    </PulseContext.Provider>
  );
}

function IdeaIcon({idea,size=32}:{idea:number;size?:number}) { return <Image source={illustration.ideas[idea]} style={{width:size,height:size,borderRadius:10}}/>; }
function PlanCard({
  y,
  fortnightly,
  onPress,
}: {
  y: number;
  fortnightly: boolean;
  onPress: () => void;
}) {
  const terms = paymentTerms(fortnightly ? "fortnightly" : "weekly");
  return (
    <At x={28} y={y} w={304} h={229}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Escoger San ${fortnightly ? "quincenal" : "semanal"}`}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: "white",
          borderRadius: 23,
          borderWidth: 1,
          borderColor: "#DEE2EC",
          shadowColor: C.ink,
          shadowOpacity: 0.07,
          shadowRadius: 9,
          shadowOffset: { width: 0, height: 5 },
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        {!fortnightly && <At x={15} y={-12} w={122} h={24} style={{backgroundColor:C.blue,borderRadius:14,alignItems:"center",justifyContent:"center"}}><T size={12} weight={800} color="white">★ La más elegida</T></At>}
        <At x={16} y={12}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              backgroundColor: "#EFF2FF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Svg width={20} height={22} viewBox="0 0 24 26">
              <Rect
                x={4}
                y={5}
                width={16}
                height={18}
                rx={3}
                fill="none"
                stroke={C.blue}
                strokeWidth={1.3}
              />
              <Path
                d="M8 2v6m8-6v6M4 10h16"
                stroke={C.blue}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              <SvgText
                x={12}
                y={20}
                fill={C.blue}
                fontSize={10}
                fontWeight="700"
                textAnchor="middle"
              >
                {fortnightly ? "15" : "7"}
              </SvgText>
            </Svg>
          </View>
        </At>
        <At x={72} y={15}>
          <T size={19} weight={800} color={C.blue}>
            {fortnightly ? "Quincenal" : "Semanal"}
          </T>
        </At>
        <At x={191} y={10} w={98}>
          <T
            size={15}
            weight={600}
            color="#5D6787"
            style={{ textAlign: "right" }}
          >
            Cobras
          </T>
          <T
            size={38}
            weight={800}
            color="#07824A"
            style={{ textAlign: "right" }}
          >
            {money(100)}
          </T>
        </At>
        <At
          x={15}
          y={50}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <Image
            source={
              fortnightly
                ? require("../../assets/venezuela-v19/members-fortnightly.png")
                : require("../../assets/venezuela-v19/members-weekly.png")
            }
            style={{ width: 47, height: 23 }}
            resizeMode="contain"
          />
          <T size={14} weight={700}>
            {terms.seats} personas
          </T>
        </At>
        <At x={31} y={76} style={{ flexDirection: "row", gap: 12 }}>
          <Image
            source={require("../../assets/venezuela-v19/available-flame.png")}
            style={{ width: 17, height: 20 }}
            resizeMode="contain"
          />
          <T size={13} weight={700} color="#925C00">
            Últimos puestos disponibles
          </T>
        </At>
        <At
          x={15}
          y={100}
          w={274}
          h={1}
          style={{
            borderTopWidth: 1,
            borderColor: "#E1E5EF",
            borderStyle: "dashed",
          }}
        />
        <At
          x={15}
          y={110}
          w={274}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <T size={13} color="#5C6684">
            Cuota
          </T>
          <T size={13} color="#5C6684">
            {money(terms.quota, true)}
          </T>
        </At>
        <At
          x={15}
          y={128}
          w={274}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <T size={12} color="#5C6684">
            Garantía y servicio (con IVA)
          </T>
          <T size={13} color="#5C6684">
            {money(terms.service)}
          </T>
        </At>
        <At
          x={15}
          y={148}
          w={274}
          h={1}
          style={{ backgroundColor: "#E1E5EF" }}
        />
        <At
          x={15}
          y={155}
          w={274}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <T size={14} weight={700}>
            {fortnightly ? "Pagas cada quince días" : "Pagas cada semana"}
          </T>
          <T size={20} weight={800}>
            {money(terms.total)}
          </T>
        </At>
        <At
          x={62}
          y={183}
          w={180}
          h={34}
          style={{
            backgroundColor: C.green,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
          }}
        >
          <T size={14} weight={700}>
            Escoger
          </T>
          <View style={{ transform: [{ rotate: "180deg" }] }}>
            <Icon name="back" size={18} color={C.ink} />
          </View>
        </At>
      </Pressable>
    </At>
  );
}
function TermsPanel({
  read,
  progress,
  onRead,
  onProgress,
}: {
  read: boolean;
  progress: number;
  onRead: () => void;
  onProgress: (n: number) => void;
}) {
  return (
    <Card
      x={28}
      y={166}
      w={304}
      h={254}
      style={{
        shadowOpacity: 0,
        elevation: 0,
        borderRadius: 23,
        overflow: "hidden",
      }}
    >
      <At
        x={0}
        y={0}
        w={304}
        h={53}
        style={{
          backgroundColor: "#F8F9FD",
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Icon name="document" size={20} />
        <View style={{ flex: 1 }}>
          <T size={13} weight={700}>
            Términos y condiciones
          </T>
          <T size={11.5} color="#586482">
            Generales y de Venezuela
          </T>
        </View>
        {read ? (
          <View
            style={{ backgroundColor: "#EAFBF2", borderRadius: 15, padding: 5 }}
          >
            <T size={12} weight={700} color={C.money}>
              ✓ Leído
            </T>
          </View>
        ) : (
          <T size={13} weight={700} color="#929CB8">
            {Math.round(progress)} %
          </T>
        )}
      </At>
      <At x={0} y={51} w={304} h={5} style={{ backgroundColor: "#E4E8F0" }}>
        <View
          style={{
            width: `${read ? 100 : progress}%`,
            height: 5,
            backgroundColor: C.green,
          }}
        />
      </At>
      <At x={13} y={65} w={278} h={149}>
        <ScrollView
          scrollEventThrottle={80}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              e.nativeEvent;
            const scrollable = contentSize.height - layoutMeasurement.height;
            const fraction = scrollable > 0 ? contentOffset.y / scrollable : 1;
            if (fraction >= 0.98) onRead();
            else onProgress(Math.max(15, Math.min(99, fraction * 100)));
          }}
          showsVerticalScrollIndicator={!read}
          contentContainerStyle={{ paddingBottom: 5 }}
        >
          {!read && (
            <>
              <T
                size={11.5}
                weight={700}
                color="#939EB9"
                style={{ letterSpacing: 1.2 }}
              >
                TÉRMINOS GENERALES DE USO
              </T>
              <T
                size={11.5}
                color="#69728A"
                style={{ fontFamily: "Inter", lineHeight: 16.5, marginTop: 6 }}
              >
                1. TuTurno es una plataforma tecnológica que organiza grupos de
                personas verificadas que se turnan para cobrar, y cobra un
                servicio por organizar el grupo y responder si alguien falla.
              </T>
            </>
          )}
          {Array.from({ length: read ? 6 : 20 }, (_, i) => (
            <View
              key={i}
              style={{
                height: 7,
                marginTop: read ? 9 : i % 3 === 0 ? 16 : 9,
                width: `${[96, 91, 94, 73, 99, 92, 45][i % 7]}%`,
                borderRadius: 5,
                backgroundColor: i % 3 === 0 ? "#EDF0F5" : "#F5F6FA",
              }}
            />
          ))}
          <T
            size={11}
            weight={700}
            color="#929EB9"
            style={{
              fontFamily: "Inter",
              textAlign: "center",
              letterSpacing: 1.5,
              marginTop: 12,
            }}
          >
            FIN DE LOS TÉRMINOS
          </T>
        </ScrollView>
      </At>
      <At
        x={13}
        y={211}
        w={278}
        h={31}
        style={{
          backgroundColor: read ? "#E8FAF0" : "white",
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <T size={13} weight={700} color={read ? "#05874B" : C.blue}>
          {read
            ? "✓  Llegaste al final: ya puedes marcar"
            : "Desliza hasta el final para aceptar ↓"}
        </T>
      </At>
    </Card>
  );
}
function RealPayment({
  failed,
  idea,
  terms,
  bolivars,
  referral,
  onPay,
  onRemind,
  onSupport,
}: {
  failed: boolean;
  idea: number;
  terms: ReturnType<typeof paymentTerms>;
  bolivars: string | null;
  referral: string | null;
  onPay: () => void;
  onRemind: () => void;
  onSupport: () => void;
}) {
  const top = failed ? 206 : 118;
  const purpose = PURPOSES[idea];
  const purposeOffset = purpose ? 0 : 34;
  const heroH = (failed ? 247 : 311) - purposeOffset;
  return (
    <>
      {failed && (
        <At x={28} y={118} w={304} h={78}>
          <Pressable
            onPress={onSupport}
            accessibilityRole="button"
            accessibilityLabel="El pago no se completó. Si ya te descontaron, escríbenos."
            style={{ flex: 1 }}
          >
            <AlertBox
              kind="yellow"
              title="Tu pago no se completó."
              body="Intenta otra vez. ¿Ya te descontaron? No pagues de nuevo y escríbenos."
            />
          </Pressable>
        </At>
      )}
      <At
        x={28}
        y={top}
        w={304}
        h={heroH}
        style={{
          borderRadius: 23,
          borderWidth: 1,
          borderColor: "#C6EDDA",
          backgroundColor: "#F0FBF5",
        }}
      >
        <At x={failed ? 129 : 117} y={failed ? 12 : 20} w={failed ? 48 : 72}>
          <PaperTicket size={failed ? 48 : 72} />
        </At>
        <At
          x={25}
          y={failed ? 78 : 118}
          w={254}
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 7,
          }}
        >
          <T size={20} weight={700}>
            Cobras
          </T>
          <T size={52} weight={800} color="#07824A">
            {money(100)}
          </T>
        </At>
        {purpose && <At
          x={14}
          y={failed ? 132 : 182}
          w={276}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          <IdeaIcon idea={idea} size={25} />
          <T size={16} weight={700} style={{ flexShrink: 1 }}>
            para {purpose}
          </T>
        </At>}
        <At x={failed ? 48 : 53} y={(failed ? 166 : 216) - purposeOffset} w={failed ? 208 : 198}>
          <Guarantee small />
        </At>
        <At
          x={18}
          y={(failed ? 190 : 246) - purposeOffset}
          w={268}
          h={1}
          style={{
            borderTopWidth: 1,
            borderColor: "#C8E9DA",
            borderStyle: "dashed",
          }}
        />
        <At x={18} y={(failed ? 199 : 258) - purposeOffset} w={268}>
          <CalendarNote small />
        </At>
      </At>
      <At x={29} y={(failed ? 467 : 446) - purposeOffset}>
        <T size={19} weight={800}>
          Haz tu pago móvil
        </T>
      </At>
      <At
        x={29}
        y={(failed ? 499 : 479) - purposeOffset}
        w={302}
        style={{ flexDirection: "row", justifyContent: "space-between" }}
      >
        <T size={14} color="#566181">
          Cuota 1
        </T>
        <T size={14} color="#566181">
          {money(terms.quota, true)}
        </T>
      </At>
      <At
        x={29}
        y={(failed ? 520 : 500) - purposeOffset}
        w={302}
        style={{ flexDirection: "row", justifyContent: "space-between" }}
      >
        <T size={13} color="#566181">
          Garantía y servicio (con IVA)
        </T>
        <T size={14} color="#566181">
          {money(terms.service)}
        </T>
      </At>
      <At
        x={29}
        y={(failed ? 544 : 522) - purposeOffset}
        w={302}
        h={1}
        style={{ backgroundColor: "#E0E4EB" }}
      />
      <At
        x={29}
        y={(failed ? 553 : 531) - purposeOffset}
        w={302}
        style={{ flexDirection: "row", justifyContent: "space-between" }}
      >
        <View>
          <T size={17} weight={800}>
            Pagas hoy
          </T>
          <T size={12} color="#566181" style={{ marginTop: 5 }}>
            Tu primera cuota
          </T>
        </View>
        <View>
          <T size={34} weight={800} style={{ textAlign: "right" }}>
            {money(terms.total)}
          </T>
          {bolivars && (
            <T size={12} color="#566181" style={{ textAlign: "right" }}>
              {bolivars}
            </T>
          )}
        </View>
      </At>
      {referral && (
        <At
          x={42}
          y={618}
          anchor="bottom"
          w={290}
          style={{ flexDirection: "row", gap: 8 }}
        >
          <Icon name="gift" color={C.money} size={14} />
          <T size={12} color="#05844A">
            Te invitó{" "}
            <T size={12} weight={700} color="#05844A">
              {referral}.
            </T>{" "}
            Al pagar, ganan los dos.
          </T>
        </At>
      )}
      <Button
        label={failed ? "Intentar otra vez" : `Pagar ${money(terms.total)}`}
        y={643}
        onPress={onPay}
      />
      <At
        x={49}
        y={709}
        anchor="bottom"
        w={284}
        style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}
      >
        <CircleIcon name="refund" size={16} fill={C.blue} color="white" />
        <T size={12} weight={600} color={C.blue}>
          Si no te aprobamos, devolvemos tu dinero.
        </T>
      </At>
      <At x={44} y={731} w={272} anchor="bottom">
        <T size={11.5} color="#5B6480" style={{ textAlign: "center" }}>
          Te guardamos tu puesto{" "}
          <T size={11.5} weight={700}>
            10 minutos.
          </T>
        </T>
      </At>
      <At x={31} y={753} w={298} h={24} anchor="bottom">
        <Pressable
          onPress={onRemind}
          accessibilityRole="button"
          accessibilityLabel="¿Hoy no tienes la plata? Te lo recordamos después."
        >
          <T size={11.5} color="#5B6480" style={{ textAlign: "center" }}>
            ¿Hoy no tienes la plata?{" "}
            <T
              size={11.5}
              weight={700}
              color="#5B6480"
              style={{ textDecorationLine: "underline" }}
            >
              Te lo recordamos después.
            </T>
          </T>
        </Pressable>
      </At>
    </>
  );
}
function Spotlight({
  rect,
  reduce,
}: {
  rect: { x: number; y: number; w: number; h: number };
  reduce: boolean;
}) {
  const maskId=useId();
  const layout = useCanvasLayout();
  const horizontal = horizontalRect(layout, rect.x, rect.w);
  const target = { ...rect, x: horizontal.x, w: horizontal.width ?? rect.w };
  const x = useSharedValue(target.x),
    y = useSharedValue(rect.y),
    w = useSharedValue(target.w),
    h = useSharedValue(rect.h);
  useEffect(() => {
    const config = {
      duration: reduce ? 0 : 300,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    };
    x.set(withTiming(target.x, config));
    y.set(withTiming(rect.y, config));
    w.set(withTiming(target.w, config));
    h.set(withTiming(rect.h, config));
  }, [target.x, rect.y, target.w, rect.h, reduce]);
  const props = useAnimatedPropsRect(x, y, w, h);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={layout.width} height={layout.height}>
        <Defs>
          <Mask id={maskId}>
            <Rect
              x={0}
              y={0}
              width={layout.width}
              height={layout.height}
              fill="white"
            />
            <AnimatedRect animatedProps={props} rx={23} fill="black" />
          </Mask>
        </Defs>
        <Rect
          width={layout.width}
          height={layout.height}
          fill={C.veil}
          opacity={0.66}
          mask={`url(#${maskId})`}
        />
        <AnimatedRect
          animatedProps={props}
          rx={23}
          fill="none"
          stroke="white"
          strokeWidth={24}
          opacity={0.24}
        />
        <AnimatedRect
          animatedProps={props}
          rx={23}
          fill="none"
          stroke="white"
          strokeWidth={8}
          opacity={0.85}
        />
      </Svg>
    </View>
  );
}
const AnimatedRect = Animated.createAnimatedComponent(Rect);
function useAnimatedPropsRect(
  x: SharedValue<number>,
  y: SharedValue<number>,
  w: SharedValue<number>,
  h: SharedValue<number>,
) {
  return useAnimatedProps(() => ({
    x: x.get(),
    y: y.get(),
    width: w.get(),
    height: h.get(),
  }));
}
function WheelTutu({ push }: { push: number }) {
  const reduced = useReducedMotion();
  const position = useSharedValue(0);
  useEffect(() => {
    if (!push || reduced) return;
    position.set(
      withSequence(
        withTiming(3, { duration: 120 }),
        withTiming(0, { duration: 220 }),
      ),
    );
  }, [push, reduced]);
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: position.get() }],
  }));
  return (
    <Animated.View style={motion}>
      <Image
        source={require("../../assets/venezuela-v19/wheel-tutu.png")}
        style={{ width: 82, height: 105 }}
        accessibilityLabel="Tutu impulsa la rueda"
      />
    </Animated.View>
  );
}
function PracticeWheel({
  onSpin,
  onResult,
  value,
  reduce,
}: {
  onSpin: () => void;
  onResult: (n: number) => void;
  value: number | null;
  reduce: boolean;
}) {
  const rotation = useSharedValue(value === null ? 0 : 72 - (value - 1) * 36);
  const [spinning, setSpinning] = useState(false);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get()}deg` }],
  }));
  const finish = (number: number) => {
    setSpinning(false);
    onResult(number);
  };
  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    onSpin();
    const n = 1 + Math.floor(Math.random() * 10);
    const desired = (72 - (n - 1) * 36 + 360) % 360;
    const current = ((rotation.get() % 360) + 360) % 360;
    const target = rotation.get() + 1080 + ((desired - current + 360) % 360);
    rotation.set(
      withTiming(
        target,
        {
          duration: reduce ? 0 : 2000,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        },
        (finished) => {
          if (finished) scheduleOnRN(finish, n);
        },
      ),
    );
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        spinning
          ? "La rueda está girando"
          : value
            ? `Tu turno de práctica es ${value}. Volver a girar`
            : "Toca para simular tu turno"
      }
      accessibilityState={{ disabled: spinning }}
      onPress={spin}
      style={{
        width: 123,
        height: 123,
        borderRadius: 65,
        backgroundColor: "white",
        padding: 3,
        shadowColor: C.ink,
        shadowOpacity: 0.19,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
      }}
    >
      <Animated.View style={[{ width: 117, height: 117 }, style]}>
        <Svg width={117} height={117} viewBox="0 0 200 200">
          {Array.from({ length: 10 }, (_, i) => {
            const a = ((-90 + i * 36) * Math.PI) / 180,
              b = a + (36 * Math.PI) / 180;
            const start = [100 + 99 * Math.cos(a), 100 + 99 * Math.sin(a)],
              end = [100 + 99 * Math.cos(b), 100 + 99 * Math.sin(b)];
            return (
              <Path
                key={i}
                d={`M100 100 L${start[0]} ${start[1]} A99 99 0 0 1 ${end[0]} ${end[1]} Z`}
                fill={
                  [
                    C.blue,
                    C.green,
                    "#FDCB00",
                    "#386AFF",
                    C.green,
                    C.blue,
                    C.green,
                    "#FFCA00",
                    "#386AFF",
                    C.money,
                  ][i]
                }
                stroke="white"
                strokeWidth={3}
              />
            );
          })}
        </Svg>
        {Array.from({ length: 10 }, (_, i) => (
          <WheelLabel key={i} index={i} rotation={rotation} />
        ))}
      </Animated.View>
      <At
        x={45}
        y={45}
        w={33}
        h={33}
        style={{
          backgroundColor: "white",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="shield-filled" size={23} />
      </At>
      <At x={119} y={49}>
        <Svg width={20} height={24}>
          <Path
            d="M0 12 18 1v22Z"
            fill={C.ink}
            stroke="white"
            strokeWidth={2}
          />
        </Svg>
      </At>
    </Pressable>
  );
}
function WheelLabel({
  index,
  rotation,
}: {
  index: number;
  rotation: SharedValue<number>;
}) {
  const a = ((-72 + index * 36) * Math.PI) / 180;
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.get()}deg` }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 58.5 + 42 * Math.cos(a) - 12,
          top: 58.5 + 42 * Math.sin(a) - 10,
          width: 24,
          height: 20,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <T
        size={16}
        weight={700}
        color={index === 2 || index === 7 ? C.ink : "white"}
      >
        {index + 1}
      </T>
    </Animated.View>
  );
}
