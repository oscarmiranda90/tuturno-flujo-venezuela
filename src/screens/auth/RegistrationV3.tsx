import React, { useEffect, useId, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PortraitLayer, Testimonials, TestimonialLayer } from "../../platform/carousel";
import * as Clipboard from "../../platform/clipboard";
import * as Haptics from "../../platform/haptics";
import { LinearGradient } from "../../platform/gradient";
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  Mask,
  LinearGradient as SvgGradient,
  Stop,
  Image as SvgImage,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark } from "../../components/BrandMark";
import { SHOW_DEV_TOOLS } from "../../devTools";
import {
  isValidEmail,
  isWeakPin,
  normalizeCode,
  registrationPreview,
  type RegistrationCountry,
  type RegistrationProvider,
  type RegistrationServices,
} from "./registrationV3State";
export type {
  RegistrationCountry,
  RegistrationProvider,
  RegistrationServices,
} from "./registrationV3State";
type Props = {
  edition?: "v3" | "v19";
  referenceKeyboard?: boolean;
  initialCountry?: RegistrationCountry;
  initialEmail?: string;
  onComplete: (country: RegistrationCountry) => void;
  onPaidLogin?: () => void;
  initialPreview?: string;
  services?: RegistrationServices;
  deliveredCount?: string;
  onEvent?: (name: string, screen: number) => void;
  onCountryChange?: (country: RegistrationCountry) => void;
};
type Stage = "start" | "otp" | "pin" | "login";
type Sheet = "country" | "providers" | "privacy" | null;
const navy = "#0B1340",
  blue = "#0023D1",
  green = "#20D672";
// Cinco historias de la página venezolana, con fotografías originales de la comunidad.
const people = [
  {
    image: require("../../../assets/registration-v3/testimonios/mary-delgado.jpg"),
    portraitScale: 1,
    portraitY: 0,
    quote: "Con mi turno compré el horno y hoy vendo mis postres.",
    name: "Mary Delgado · Caracas",
  },
  {
    image: require("../../../assets/registration-v3/testimonios/carolina-nieves.jpg"),
    portraitScale: 1,
    portraitY: -160,
    quote: "La receta ya la tenía. Con mi turno armé el kit para mis pizzas.",
    name: "Carolina Nieves · Caracas",
  },
  {
    image: require("../../../assets/registration-v3/testimonios/deivy-marquez.jpg"),
    portraitScale: 0.9,
    portraitY: 0,
    quote: "Con mi turno reuní para los termos y el café. ¡Listo para acompañar la mañana de mis panas!",
    name: "Deivy Márquez · Miranda",
  },
  {
    image: require("../../../assets/registration-v3/testimonios/bernardo-caldeira.jpg"),
    portraitScale: 1.4,
    portraitY: -220,
    quote: "¡Con TuTurno completé para invertir en mi negocio!",
    name: "Bernardo Caldeira · Caracas",
  },
  {
    image: require("../../../assets/registration-v3/testimonios/yenifer-abreu.jpg"),
    portraitScale: 1,
    portraitY: 0,
    quote: "Con ese SAN pude comprar mi primer kit para hacer manos y pies.",
    name: "Yenifer Abreu · Anzoátegui",
  },
];

const fixture: RegistrationServices = {
  lookupEmail: async () => "new",
  requestOtp: async () => {},
  verifyOtp: async (_, code) => /^\d{6}$/.test(code),
  savePin: async () => {},
  loginWithPin: async () => ({
    paid: false,
  }),
  loginWithProvider: async () => ({
    paid: false,
  }),
};
const unavailable =
  "Este servicio no está disponible por ahora. Inténtalo más tarde.";
export function RegistrationV3({
  edition = "v19",
  referenceKeyboard = false,
  initialCountry = "VE",
  initialEmail = "",
  onComplete,
  onPaidLogin,
  initialPreview,
  services,
  deliveredCount = "+100.000",
  onEvent,
  onCountryChange,
}: Props) {
  const previewState = registrationPreview(initialPreview, SHOW_DEV_TOOLS);
  const preview = previewState.enabled;
  const adapter = services ?? (preview ? fixture : undefined);
  const [country, setCountry] = useState(initialCountry);
  const [countryDraft, setCountryDraft] = useState(initialCountry);
  const [email, setEmail] = useState(initialEmail);
  const [stage, setStage] = useState<Stage>(previewState.stage);
  const [sheet, setSheet] = useState<Sheet>(previewState.sheet);
  const [slide, setSlide] = useState(previewState.slide);
  const portraitId = useId().replace(/:/g, "");
  const [code, setCode] = useState(
    preview && (initialPreview === "otp" || initialPreview === "otp-country")
      ? "482"
      : "",
  );
  const [pin, setPin] = useState(
    preview && initialPreview === "pin"
      ? "628"
      : previewState.repeat
        ? "62"
        : "",
  );
  const [firstPin, setFirstPin] = useState<string | null>(
    previewState.repeat ? "628194" : null,
  );
  const [error, setError] = useState(
    previewState.error === "login"
      ? "Clave incorrecta. Inténtalo de nuevo."
      : previewState.error === "otp"
        ? "Código incorrecto. Inténtalo de nuevo."
        : previewState.error === "mismatch"
          ? "No coinciden, créala de nuevo"
          : previewState.error === "weak"
            ? "Esta clave es muy fácil. Elige otra."
            : "",
  );
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const [keypadWidth, setKeypadWidth] = useState(304);
  const input = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (stage !== "start" || (preview && initialPreview !== "start")) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % people.length),
      5000,
    );
    return () => clearInterval(id);
  }, [stage, preview, initialPreview]);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  useEffect(() => {
    if (stage === "start") onEventRef.current?.("inicio_visto", 1);
    if (stage === "otp") onEventRef.current?.("codigo_visto", 2);
  }, [stage]);
  useEffect(() => {
    if (stage !== "otp" || seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [stage, seconds]);
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await action();
    } catch {
      setError(unavailable);
    } finally {
      setBusy(false);
    }
  };
  const requireAdapter = () => {
    if (!adapter) throw new Error("Servicio no disponible");
    return adapter;
  };
  const begin = () =>
    run(async () => {
      const api = requireAdapter();
      const result = await api.lookupEmail(email.trim());
      if (result === "existing") {
        setStage("login");
        setPin("");
      } else {
        await api.requestOtp(email.trim());
        setSeconds(30);
        setCode("");
        setStage("otp");
      }
      Keyboard.dismiss();
    });
  const finishLogin = (result: {
    paid: boolean;
    country?: RegistrationCountry;
  }) => {
    if (result.paid) {
      if (onPaidLogin) onPaidLogin();
      else setError(unavailable);
    } else onComplete(result.country ?? country);
  };
  const provider = (name: RegistrationProvider) => {
    setSheet(null);
    run(async () =>
      finishLogin(await requireAdapter().loginWithProvider(name)),
    );
  };
  const updateCode = (value: string) => {
    const next = normalizeCode(value);
    setCode(next);
    setError("");
    if (next.length === 6)
      run(async () => {
        if (await requireAdapter().verifyOtp(email.trim(), next)) {
          Keyboard.dismiss();
          setStage("pin");
          setPin("");
        } else {
          setCode("");
          setError("Código incorrecto. Inténtalo de nuevo.");
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
        }
      });
  };
  const key = (digit: string) => {
    if (busy) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (digit === "delete") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = pin + digit;
    setPin(next);
    if (next.length !== 6) return;
    if (stage === "login") {
      setPin("");
      run(async () =>
        finishLogin(await requireAdapter().loginWithPin(email.trim(), next)),
      );
      return;
    }
    if (firstPin === null) {
      if (adapter !== fixture && isWeakPin(next)) {
        setError("Esta clave es muy fácil. Elige otra.");
        setPin("");
        return;
      }
      setFirstPin(next);
      setPin("");
      setError("");
    } else if (next !== firstPin) {
      setFirstPin(null);
      setPin("");
      setError("No coinciden, créala de nuevo");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setPin("");
      run(async () => {
        await requireAdapter().savePin(email.trim(), next, country);
        onEventRef.current?.("clave_creada", 3);
        onComplete(country);
      });
    }
  };
  const back = () => {
    Keyboard.dismiss();
    setError("");
    setPin("");
    if (stage === "pin" && firstPin !== null) setFirstPin(null);
    else setStage(stage === "pin" ? "otp" : "start");
  };
  const title =
    stage === "otp"
      ? "Revisa tu correo"
      : stage === "login"
        ? "Ingresa tu clave"
        : firstPin === null
          ? "Crea tu clave"
          : "Repite tu clave";
  const mainProvider: RegistrationProvider =
    Platform.OS === "ios" ? "apple" : "google";
  // El dibujo se extiende bajo la barra de estado nativa; solo el contenido consume el margen seguro.
  const heroInset = stage === "start" && Platform.OS !== "web" ? insets.top : 0;
  return (
    <View
      style={[
        s.root,
        {
          paddingTop: insets.top - heroInset,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          bounces={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          {stage === "start" ? (
            <>
              <View style={[s.hero, {
                height: (edition === "v19" ? 291 : 305) + heroInset,
                paddingTop: 15 + heroInset,
              }]}>
                <View
                  pointerEvents="none"
                  style={[
                    s.photo,
                    edition === "v19" && { width: "68%", height: 346 + heroInset, right: -7 },
                  ]}
                >
                  {people.map((person, index) => {
                    const state = index === slide ? "active"
                      : index === (slide + people.length - 1) % people.length
                        ? "previous" : "hidden";
                    const maskId = `${portraitId}-portrait-${index}`;
                    return (
                      <PortraitLayer key={person.name} state={state}>
                        <Svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 610 865"
                          preserveAspectRatio="xMidYMid slice"
                        >
                          <Defs>
                            <SvgGradient id={`${maskId}-feather`} x1="0" y1="0" x2="610" y2="0" gradientUnits="userSpaceOnUse">
                              <Stop offset="0" stopColor="white" stopOpacity={0} />
                              <Stop offset="0.16" stopColor="white" stopOpacity={0} />
                              <Stop offset="0.34" stopColor="white" stopOpacity={0.5} />
                              <Stop offset="0.56" stopColor="white" stopOpacity={1} />
                            </SvgGradient>
                            <Mask id={maskId}>
                              <Rect width={610} height={865} fill={`url(#${maskId}-feather)`} />
                            </Mask>
                          </Defs>
                          <SvgImage
                            href={person.image}
                            preserveAspectRatio="xMidYMin slice"
                            x={40 - (person.portraitScale - 1) * 305}
                            y={person.portraitY}
                            width={610 * person.portraitScale}
                            height={865 * person.portraitScale}
                            mask={`url(#${maskId})`}
                          />
                        </Svg>
                      </PortraitLayer>
                    );
                  })}
                </View>
                {edition === "v19" && <LinearGradient
                  colors={["#081349", "#081349D0", "#08134900"]}
                  locations={[0, 0.3, 0.7]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />}
                <LinearGradient
                  colors={["#08134900", "#08134900", blue]}
                  locations={[0, 0.68, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.brand}>
                  <BrandMark size={38} />
                  <Text
                    style={[s.brandText, edition === "v19" && { fontSize: 28 }]}
                  >
                    tu turno
                  </Text>
                </View>
                <Text style={s.slogan}>
                  {country === "VE"
                    ? "El primer San digital del país"
                    : "La primera cadena digital del país"}
                </Text>
                <View style={[s.heroBottom, edition === "v19" && { paddingBottom: 26 }]}>
                  <Text style={[s.counter, edition === "v19" && { fontSize: 36, lineHeight: 42 }]}>{deliveredCount}</Text>
                  <Text style={[s.heroSub, edition === "v19" && { fontSize: 14, fontFamily: "Outfit_500Medium" }]}>
                    turnos de {country === "VE" ? "San" : "cadena"} entregados
                  </Text>
                  <View style={[s.quote, edition === "v19" && { maxWidth: 205 }]}>
                    <Testimonials>
                      {people.map((person, index) => (
                        <TestimonialLayer key={person.name} active={index === slide}>
                          <Text style={s.quoteText}>“{person.quote}”</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <Svg width={13} height={13} viewBox="0 0 16 16">
                              <Circle cx={8} cy={8} r={8} fill={green} />
                              <Path d="M4 8 L7 11 L12 5" stroke="white" strokeWidth={2} fill="none" />
                            </Svg>
                            <Text style={s.quoteName}>{person.name}</Text>
                          </View>
                        </TestimonialLayer>
                      ))}
                    </Testimonials>
                  </View>
                </View>
              </View>
              <View style={[s.startCard, edition === "v19" && { paddingTop: 33 }]}>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  <Svg width={30} height={34} viewBox="0 0 30 34">
                    <Path
                      fill="#0A9F55"
                      d="M15 0 28 5v11c0 8-5 14-13 18C7 30 2 24 2 16V5z"
                    />
                    <Path
                      d="m8 16 5 5 9-10"
                      fill="none"
                      stroke="white"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text
                    style={[
                      s.heading,
                      {
                        flex: 1,
                      },
                    ]}
                  >
                    Tu turno está garantizado
                  </Text>
                </View>
                <Text style={s.subtitle}>
                  Si alguien falla,{" "}
                  <Text
                    style={{
                      color: "#0A9F55",
                      fontFamily: "Outfit_700Bold",
                    }}
                  >
                    tú cobras completo.
                  </Text>
                </Text>
                <Text style={[s.label, edition === "v19" && { marginTop: 26 }]}>Prueba cómo cobras tu turno</Text>
                <View style={{ position: "relative" }}>
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 15,
                      top: 18,
                      zIndex: 1,
                    }}
                  >
                    <Svg width={19} height={18} viewBox="0 0 24 22">
                      <Rect
                        x={2}
                        y={3}
                        width={20}
                        height={16}
                        rx={3}
                        stroke="#9ba4bb"
                        strokeWidth={2}
                        fill="none"
                      />
                      <Path
                        d="M3 5 L12 12 L21 5"
                        stroke="#9ba4bb"
                        strokeWidth={2}
                        fill="none"
                      />
                    </Svg>
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tucorreo@ejemplo.com"
                    placeholderTextColor="#9BA4BB"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    accessibilityLabel="Correo electrónico"
                    style={[s.email, { paddingLeft: 43 }]}
                  />
                </View>
                {error ? <Text style={s.error}>{error}</Text> : null}
                <Button
                  label="Continuar  →"
                  disabled={(adapter !== fixture && !isValidEmail(email)) || busy}
                  onPress={begin}
                />
                <ProviderButton
                  provider={mainProvider}
                  onPress={() => provider(mainProvider)}
                />
                <Link
                  label="Otras opciones  ›"
                  onPress={() => setSheet("providers")}
                />
                <Text style={s.privacy}>
                  Al continuar aceptas la{" "}
                  <Text style={s.link} onPress={() => setSheet("privacy")}>
                    Política de privacidad
                  </Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={s.header}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Volver"
                  onPress={back}
                  style={s.back}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 28,
                    }}
                  >
                    ‹
                  </Text>
                </Pressable>
                <Text style={s.headerText}>
                  Crea tu cuenta · paso {stage === "otp" ? 2 : 3} de 3
                </Text>
              </View>
              <View
                style={[s.progress, edition === "v19" && { marginTop: -1 }]}
              >
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      s.segment,
                      {
                        backgroundColor: "#4661DE",
                        overflow: "hidden",
                      },
                    ]}
                  >
                    <View
                      style={{
                        height: "100%",
                        backgroundColor: green,
                        width:
                          i < (stage === "otp" ? 1 : 2)
                            ? "100%"
                            : i === (stage === "otp" ? 1 : 2)
                              ? firstPin
                                ? "80%"
                                : "45%"
                              : "0%",
                      }}
                    />
                  </View>
                ))}
              </View>
              <View
                style={[
                  s.pill,
                  edition === "v19" && { marginVertical: 15 },
                  { flexDirection: "row", alignItems: "center", gap: 6 },
                ]}
              >
                <Svg width={13} height={13} viewBox="0 0 16 16">
                  <Circle
                    cx={8}
                    cy={8}
                    r={6}
                    stroke="#d7e3ff"
                    strokeWidth={1.3}
                    fill="none"
                  />
                  <Path
                    d="M8 4 V8 L11 10"
                    stroke="#d7e3ff"
                    strokeWidth={1.3}
                    fill="none"
                  />
                </Svg>
                <Text
                  style={{
                    color: "white",
                    fontFamily: "Outfit_600SemiBold",
                    fontSize: 13,
                  }}
                >
                  {stage === "otp"
                    ? "Ya casi: en un minuto simulas tu turno"
                    : firstPin
                      ? "Último paso: confírmala y empezamos"
                      : "Falta poco para simular tu turno"}
                </Text>
              </View>
              <View style={[s.card, edition === "v19" && { paddingHorizontal: 16, paddingTop: 24 }]}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={[s.iconTile, edition === "v19" && { width: 40, height: 40 }]}>
                    <AuthIcon mail={stage === "otp"} />
                  </View>
                  <Text style={[s.heading, { flex: 1 }]}>{title}</Text>
                </View>
                {stage === "otp" ? (
                  <>
                    <Text style={s.description}>
                      Te enviamos un código de 6 números a:
                    </Text>
                    <Text style={s.strong}>
                      {email || "nuevo@ejemplo.com"}{" "}
                      <Text style={s.link} onPress={back}>
                        · Cámbialo
                      </Text>
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        marginTop: edition === "v19" ? 8 : 10,
                      }}
                    >
                      <Text style={[s.description, edition === "v19" && { marginTop: 0, fontSize: 13 }]}>Tu país: </Text>
                      <Flag country={country} />
                      <Text style={s.strong}>
                        {country === "VE" ? "Venezuela" : "Colombia"}
                      </Text>
                      <Text
                        style={s.link}
                        onPress={() => {
                          Keyboard.dismiss();
                          setCountryDraft(country);
                          setSheet("country");
                        }}
                      >
                        · Cambiar
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel="Código de seis números"
                      onPress={() => input.current?.focus()}
                      style={[s.codeRow, edition === "v19" && { marginTop: 13, gap: 10 }]}
                    >
                      {Array.from(
                        {
                          length: 6,
                        },
                        (_, i) => (
                          <View
                            key={i}
                            style={[
                              s.codeBox,
                              i === code.length && s.activeBox,
                              !!error && {
                                borderColor: "#D93F45",
                              },
                            ]}
                          >
                            {edition === "v19" && i === code.length ? <View style={{ width: 1.5, height: 29, backgroundColor: navy }} />
                              : <Text style={s.codeDigit}>{code[i] ?? ""}</Text>}
                          </View>
                        ),
                      )}
                    </Pressable>
                    <TextInput
                      ref={input}
                      value={code}
                      onChangeText={updateCode}
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      textContentType="oneTimeCode"
                      maxLength={6}
                      autoFocus={!preview}
                      style={s.hiddenInput}
                      accessibilityLabel="Escribe el código"
                    />
                    <View style={s.row}>
                      <Pressable
                        onPress={async () => {
                          try {
                            updateCode(await Clipboard.getStringAsync());
                          } catch {
                            setError(
                              "No se pudo leer el portapapeles. Escribe el código.",
                            );
                          }
                        }}
                      >
                        <View
                          style={[
                            s.paste,
                            {
                              flexDirection: "row",
                              gap: 5,
                              alignItems: "center",
                            },
                          ]}
                        >
                          <Svg width={13} height={14} viewBox="0 0 16 18">
                            <Rect
                              x={3}
                              y={3}
                              width={11}
                              height={14}
                              rx={2}
                              stroke={blue}
                              strokeWidth={1.5}
                              fill="none"
                            />
                            <Rect
                              x={6}
                              y={1}
                              width={5}
                              height={4}
                              rx={1}
                              fill="#edf1ff"
                              stroke={blue}
                            />
                          </Svg>
                          <Text
                            style={{
                              fontFamily: "Outfit_700Bold",
                              color: blue,
                              fontSize: 13,
                            }}
                          >
                            Pegar código
                          </Text>
                        </View>
                      </Pressable>
                      <Text
                        style={seconds ? s.muted : s.link}
                        onPress={() => {
                          if (!seconds)
                            run(async () => {
                              await requireAdapter().requestOtp(email.trim());
                              setSeconds(30);
                            });
                        }}
                      >
                        {seconds
                          ? `Reenviar en 0:${String(seconds).padStart(2, "0")}`
                          : "Reenviar código"}
                      </Text>
                    </View>
                    <Text style={s.muted}>
                      ¿No te llega? Revisa en spam o promociones.
                    </Text>
                    <Link
                      label="¿Ya tenías cuenta con otro correo?"
                      onPress={back}
                    />
                  </>
                ) : (
                  <>
                    <Text style={s.description}>
                      {stage === "login"
                        ? "Escribe tu clave para entrar."
                        : firstPin
                          ? "Escríbela otra vez para confirmar."
                          : "6 números. Con ella entras a TuTurno."}
                    </Text>
                    <View style={[s.dots, edition === "v19" && { gap: 18, marginTop: 31, marginBottom: 33 }]}>
                      {Array.from(
                        {
                          length: 6,
                        },
                        (_, i) => (
                          <View
                            key={i}
                            style={[
                              s.dot,
                              i < pin.length && {
                                backgroundColor: blue,
                                borderColor: blue,
                              },
                              i === pin.length && {
                                borderColor: green,
                                borderWidth: 3,
                                shadowColor: green,
                                shadowOpacity: 0.35,
                                shadowRadius: 4,
                                shadowOffset: { width: 0, height: 0 },
                              },
                              !!error && {
                                borderColor: "#D93F45",
                              },
                            ]}
                          />
                        ),
                      )}
                    </View>
                    <View
                      onLayout={({ nativeEvent: { layout } }) => setKeypadWidth(layout.width)}
                      style={[s.keypad, edition === "v19" && { gap: 12 }]}
                    >
                      {[
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "",
                        "0",
                        "delete",
                      ].map((n, i) =>
                        n ? (
                          <Pressable
                            key={i}
                            accessibilityRole="button"
                            accessibilityLabel={n === "delete" ? "Borrar" : n}
                            onPress={() => key(n)}
                            style={({ pressed }) => [
                              s.key,
                              edition === "v19" && { height: 74, width: (keypadWidth - 28) / 3 },
                              edition === "v19" && n === "delete" && s.secondary,
                              pressed && {
                                backgroundColor: "#D1D9EB",
                              },
                            ]}
                          >
                            {n === "delete" ? (
                              <Svg width={27} height={23} viewBox="0 0 30 24">
                                <Path
                                  d="M11 3 H27 V21 H11 L2 12 Z M14 8 L22 16 M22 8 L14 16"
                                  stroke={navy}
                                  strokeWidth={2}
                                  strokeLinejoin="round"
                                  fill="none"
                                />
                              </Svg>
                            ) : (
                              <Text style={s.keyText}>{n}</Text>
                            )}
                            {n === "delete" && (
                              <Text style={s.keyCaption}>Borrar</Text>
                            )}
                          </Pressable>
                        ) : (
                          <View key={i} style={[s.keyEmpty, edition === "v19" && { height: 74, width: (keypadWidth - 28) / 3 }]} />
                        ),
                      )}
                    </View>
                    {firstPin ? (
                      <Link
                        label="¿Te equivocaste? Empieza de nuevo"
                        onPress={() => {
                          setFirstPin(null);
                          setPin("");
                          setError("");
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          marginTop: edition === "v19" ? 24 : 18,
                        }}
                      >
                        <Svg width={12} height={14} viewBox="0 0 16 18">
                          <Rect
                            x={3}
                            y={7}
                            width={10}
                            height={9}
                            rx={2}
                            stroke="#8991a7"
                            strokeWidth={1.5}
                            fill="none"
                          />
                          <Path
                            d="M5 7 V4 Q8 -1 11 4 V7"
                            stroke="#8991a7"
                            strokeWidth={1.5}
                            fill="none"
                          />
                        </Svg>
                        <Text style={[s.muted, { fontSize: edition === "v19" ? 13 : 11 }]}>
                          Nadie de TuTurno te va a pedir esta clave.
                        </Text>
                      </View>
                    )}
                  </>
                )}
                {error ? (
                  <Text accessibilityRole="alert" style={s.error}>
                    {error}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {referenceKeyboard && Platform.OS === "web" && stage === "otp" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 292,
            backgroundColor: "#D1D3D9",
            paddingHorizontal: 6,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Autocompletar código 482915"
            onPress={() => updateCode("482915")}
            style={{
              height: 50,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Outfit_400Regular",
                fontSize: 15,
                color: "#3A3D48",
              }}
            >
              Del correo{" "}
              <Text style={{ fontFamily: "Outfit_600SemiBold", color: navy }}>
                482915
              </Text>
            </Text>
          </Pressable>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "",
              "0",
              "delete",
            ].map((digit, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={
                  digit === "delete" ? "Borrar código" : digit || "Espacio"
                }
                disabled={!digit}
                onPress={() =>
                  updateCode(
                    digit === "delete" ? code.slice(0, -1) : code + digit,
                  )
                }
                style={{
                  width: 112,
                  height: 47,
                  borderRadius: 6,
                  backgroundColor:
                    !digit || digit === "delete" ? "transparent" : "white",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottomWidth: digit && digit !== "delete" ? 1 : 0,
                  borderBottomColor: "#9EA0A6",
                }}
              >
                <Text
                  style={{
                    fontSize: 25,
                    lineHeight: 27,
                    fontFamily: "Outfit_400Regular",
                    color: navy,
                  }}
                >
                  {digit === "delete" ? "⌫" : digit}
                </Text>
                {!!digit && digit !== "delete" && (
                  <Text
                    style={{
                      fontSize: 9,
                      lineHeight: 9,
                      letterSpacing: 2,
                      fontFamily: "Outfit_600SemiBold",
                      color: navy,
                    }}
                  >
                    {
                      [
                        "",
                        "ABC",
                        "DEF",
                        "GHI",
                        "JKL",
                        "MNO",
                        "PQRS",
                        "TUV",
                        "WXYZ",
                        "",
                        "",
                        "",
                      ][i]
                    }
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <View style={s.overlay}>
          <Pressable
            style={{
              flex: 1,
            }}
            onPress={() => setSheet(null)}
            accessibilityLabel="Cerrar"
          />
          <View
            style={[
              s.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <View style={s.handle} />
            {sheet === "country" ? (
              <>
                <Text style={s.sheetTitle}>¿En qué país vives?</Text>
                <Text style={s.description}>
                  Así te mostramos tu {country === "VE" ? "San" : "cadena"} con
                  la moneda y las reglas de tu país.
                </Text>
                {(["VE", "CO"] as const).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCountryDraft(c)}
                    style={[
                      s.country,
                      c === countryDraft && {
                        borderColor: green,
                        backgroundColor: "#F0FCF5",
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Flag country={c} />
                      <Text style={s.strong}>
                        {c === "VE" ? "Venezuela" : "Colombia"}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: c === countryDraft ? 0 : 1,
                        borderColor: "#aeb8cf",
                        backgroundColor:
                          c === countryDraft ? green : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {c === countryDraft && (
                        <Text
                          style={{
                            color: "white",
                            fontFamily: "Outfit_700Bold",
                            fontSize: 16,
                          }}
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
                <Button
                  label="Listo"
                  onPress={() => {
                    setCountry(countryDraft);
                    onCountryChange?.(countryDraft);
                    setSheet(null);
                  }}
                />
              </>
            ) : sheet === "providers" ? (
              <>
                <Text style={s.sheetTitle}>Otras formas de entrar</Text>
                <Text style={s.description}>
                  Elige la que ya usas en tu teléfono.
                </Text>
                {(["apple", "google", "facebook"] as const)
                  .filter((p) => p !== mainProvider)
                  .map((p) => (
                    <ProviderButton
                      key={p}
                      provider={p}
                      onPress={() => provider(p)}
                    />
                  ))}
                <Link label="Cancelar" onPress={() => setSheet(null)} />
              </>
            ) : (
              <>
                <Text style={s.sheetTitle}>Política de privacidad</Text>
                <Text style={s.description}>
                  La política de privacidad no está disponible en este momento.
                </Text>
                <Link label="Cerrar" onPress={() => setSheet(null)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
function Flag({ country }: { country: RegistrationCountry }) {
  return (
    <Svg
      width={24}
      height={16}
      viewBox="0 0 24 16"
      accessibilityLabel={country === "VE" ? "Venezuela" : "Colombia"}
    >
      <Rect width={24} height={16} rx={2} fill="#FCD116" />
      <Path
        fill="#0038A8"
        d={country === "VE" ? "M0 5.3h24v5.4H0z" : "M0 8h24v4H0z"}
      />
      <Path
        fill="#CE1126"
        d={country === "VE" ? "M0 10.7h24V16H0z" : "M0 12h24v4H0z"}
      />
      {country === "VE" &&
        [8, 10, 12, 14, 16].map((x, i) => (
          <Circle
            key={x}
            cx={x}
            cy={7.5 - Math.sin((i * Math.PI) / 4)}
            r={0.45}
            fill="white"
          />
        ))}
    </Svg>
  );
}
function AuthIcon({ mail }: { mail: boolean }) {
  return (
    <Svg
      width={23}
      height={23}
      viewBox="0 0 24 24"
      fill="none"
      stroke={blue}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {mail ? (
        <>
          <Rect x={2} y={5} width={20} height={14} rx={2} />
          <Path d="m3 6 9 7 9-7" />
        </>
      ) : (
        <>
          <Rect x={5} y={10} width={14} height={11} rx={2} />
          <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      )}
    </Svg>
  );
}
function ProviderButton({
  provider,
  onPress,
}: {
  provider: RegistrationProvider;
  onPress: () => void;
}) {
  const label = `Continuar con ${provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Facebook"}`;
  const dark = provider !== "google";
  return (
    <Pressable
      testID={`provider-${provider}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        s.button,
        s.providerButton,
        provider === "google"
          ? s.secondary
          : { backgroundColor: provider === "apple" ? "#000000" : "#1877F2" },
      ]}
    >
      <View testID={`provider-logo-${provider}`} accessible={false}>
        <ProviderLogo provider={provider} />
      </View>
      <Text style={[s.buttonText, dark && { color: "#FFFFFF" }]}>{label}</Text>
    </Pressable>
  );
}
function ProviderLogo({ provider }: { provider: RegistrationProvider }) {
  if (provider === "google")
    return (
      <Svg width={23} height={23} viewBox="0 0 24 24">
        <Path
          fill="#4285F4"
          d="M22.56 12.25c0-.71-.06-1.39-.18-2.05H12v3.88h5.93a5.07 5.07 0 0 1-2.2 3.33v2.52h3.56c2.08-1.91 3.27-4.72 3.27-7.68z"
        />
        <Path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.76c-.98.66-2.24 1.05-3.72 1.05-2.87 0-5.3-1.94-6.17-4.54H2.15v2.84A11 11 0 0 0 12 23z"
        />
        <Path
          fill="#FBBC05"
          d="M5.83 14.08A6.62 6.62 0 0 1 5.48 12c0-.72.12-1.42.35-2.08V7.08H2.15a11 11 0 0 0 0 9.84z"
        />
        <Path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16A10.57 10.57 0 0 0 12 1a11 11 0 0 0-9.85 6.08l3.68 2.84C6.7 7.32 9.13 5.38 12 5.38z"
        />
      </Svg>
    );
  if (provider === "facebook")
    return (
      <Svg width={23} height={23} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={12} fill="white" />
        <Path
          fill="#1877F2"
          d="M13.7 20v-7h2.35l.35-2.73h-2.7V8.53c0-.79.22-1.33 1.35-1.33h1.44V4.76a19 19 0 0 0-2.1-.11c-2.08 0-3.51 1.27-3.51 3.6v2.02H8.52V13h2.36v7z"
        />
      </Svg>
    );
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24">
      <Path
        fill="white"
        d="M17.05 12.5c.02 2.38 2.09 3.17 2.11 3.18-.02.06-.33 1.13-1.08 2.23-.66.95-1.34 1.9-2.4 1.92-1.04.02-1.38-.62-2.57-.62-1.18 0-1.56.6-2.54.64-1.03.04-1.82-1.03-2.48-1.97-1.35-1.94-2.38-5.47-.99-7.88a3.86 3.86 0 0 1 3.27-1.98c1-.02 1.94.68 2.55.68.6 0 1.75-.84 2.95-.72.5.02 1.92.2 2.83 1.53-.07.04-1.69.98-1.67 2.99zM15.08 6.72c.55-.67.92-1.6.82-2.53-.8.03-1.76.53-2.33 1.2-.51.59-.96 1.54-.84 2.45.88.07 1.79-.45 2.35-1.12z"
      />
    </Svg>
  );
}
function Button({
  label,
  onPress,
  secondary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[s.button, secondary && s.secondary]}
    >
      <Text style={s.buttonText}>{label}</Text>
    </Pressable>
  );
}
function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        alignSelf: "center",
        padding: 12,
      }}
    >
      <Text style={s.link}>{label}</Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: blue,
  },
  hero: {
    height: 305,
    overflow: "hidden",
    backgroundColor: "#0B175E",
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  photo: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "65%",
    height: "100%",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontFamily: "Outfit_700Bold",
    color: "white",
    fontSize: 28,
  },
  slogan: {
    fontFamily: "Outfit_600SemiBold",
    color: "white",
    fontSize: 13,
    marginTop: 4,
  },
  heroBottom: {
    marginTop: "auto",
    paddingBottom: 24,
  },
  counter: {
    color: "white",
    fontSize: 40,
    lineHeight: 44,
    fontFamily: "Outfit_700Bold",
  },
  heroSub: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
  },
  quote: {
    minHeight: 84,
    borderLeftWidth: 2,
    borderLeftColor: green,
    paddingLeft: 12,
    marginTop: 14,
    maxWidth: 250,
  },
  quoteText: {
    color: "white",
    fontSize: 13,
    fontStyle: "italic",
    fontFamily: "Outfit_500Medium",
  },
  quoteName: {
    color: "white",
    fontSize: 12,
    marginTop: 5,
    fontFamily: "Outfit_600SemiBold",
  },
  startCard: {
    backgroundColor: "white",
    borderRadius: 26,
    marginHorizontal: 12,
    padding: 18,
    marginTop: -1,
    marginBottom: 12,
    flex: 1,
  },
  heading: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    lineHeight: 32,
    color: navy,
  },
  subtitle: {
    fontFamily: "Outfit_500Medium",
    fontSize: 16,
    color: "#5A6180",
    marginTop: 10,
  },
  label: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    color: navy,
    marginTop: 24,
    marginBottom: 8,
  },
  email: {
    height: 54,
    backgroundColor: "#F4F5F9",
    borderColor: "#E3E6EF",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 15,
    fontFamily: "Outfit_500Medium",
    fontSize: 16,
    color: navy,
  },
  button: {
    height: 56,
    borderRadius: 30,
    backgroundColor: green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#00aa56",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  providerButton: { flexDirection: "row", gap: 12 },
  secondary: {
    backgroundColor: "white",
    borderColor: "#E3E6EF",
    borderWidth: 1,
    shadowOpacity: 0,
  },
  buttonText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 17,
    color: navy,
  },
  privacy: {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    color: "#8C95AA",
    textAlign: "center",
    marginVertical: 4,
  },
  link: {
    fontFamily: "Outfit_700Bold",
    color: blue,
    fontSize: 14,
  },
  header: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  back: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#2948D7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
    color: "white",
    textAlign: "center",
    flex: 1,
    marginRight: 40,
  },
  progress: {
    flexDirection: "row",
    gap: 6,
    marginHorizontal: 22,
    marginTop: 4,
  },
  segment: {
    height: 5,
    borderRadius: 3,
    flex: 1,
  },
  pill: {
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#2948C1",
    color: "white",
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginVertical: 17,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 12,
    borderRadius: 26,
    padding: 18,
    flex: 1,
    marginBottom: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: blue,
    fontSize: 25,
  },
  description: {
    fontFamily: "Outfit_500Medium",
    color: "#5A6180",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
  },
  strong: {
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
    color: navy,
  },
  codeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 20,
    marginBottom: 12,
  },
  codeBox: {
    height: 58,
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CDD3E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FC",
  },
  activeBox: {
    borderColor: green,
    borderWidth: 2,
    shadowColor: green,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  codeDigit: {
    fontFamily: "Outfit_700Bold",
    fontSize: 26,
    color: navy,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  paste: {
    color: blue,
    backgroundColor: "#EDF1FF",
    overflow: "hidden",
    borderRadius: 20,
    padding: 10,
    fontFamily: "Outfit_700Bold",
    fontSize: 13,
  },
  muted: {
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    color: "#8991A7",
  },
  error: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
    color: "#C62F3B",
    marginTop: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginVertical: 28,
  },
  dot: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderColor: "#B9C1D3",
    borderWidth: 2,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  key: {
    width: "30%",
    height: 72,
    backgroundColor: "#EDF0F6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8DDEA",
    borderBottomWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {
    width: "30%",
    height: 72,
  },
  keyText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 32,
    color: navy,
    lineHeight: 38,
  },
  keyCaption: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 11,
    color: navy,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#060C34AA",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  handle: {
    height: 5,
    width: 40,
    backgroundColor: "#D8DCE6",
    borderRadius: 4,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
    color: navy,
  },
  country: {
    borderWidth: 1,
    borderColor: "#E3E6EF",
    borderRadius: 16,
    padding: 17,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
