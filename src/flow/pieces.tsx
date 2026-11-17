import React, { type ReactNode } from "react";
import Svg, { Path } from "react-native-svg";
import { Image, Pressable, View } from "react-native";
import { C, GUARANTEE, VOICE } from "./content";
import { At, Check, CircleIcon, Face, Icon, T, illustration } from "./ui";
import { v19Money as money } from "../domain/money";

export function Guarantee({
  paid = false,
  small = false,
  boxed = false,
}: {
  paid?: boolean;
  small?: boolean;
  boxed?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {boxed ? (
        <CircleIcon name="shield" color={C.money} size={26} />
      ) : (
        <Icon name="shield" color={C.money} size={small ? 17 : 23} />
      )}
      <T size={small && !boxed ? 13 : 14} weight={700} color={C.money}>
        {paid ? "Tu turno quedó garantizado" : GUARANTEE}
      </T>
    </View>
  );
}
export function CalendarNote({ small = false }: { small?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <CircleIcon name="calendar" fill="white" color={C.blue} size={42} />
      <T size={small ? 14 : 15} weight={600}>
        El día que cobras,{`\n`}también pagas tu cuota.
      </T>
    </View>
  );
}
export function AlertBox({
  kind,
  title,
  body,
}: {
  kind: "green" | "blue" | "yellow";
  title: string;
  body?: string;
}) {
  const fill =
    kind === "green" ? "#E8FAF0" : kind === "blue" ? "#EBEFFF" : "#FFF7D6";
  const color =
    kind === "green" ? C.money : kind === "blue" ? C.blue : "#F7BC00";
  return (
    <View
      style={{
        height: "100%",
        borderRadius: 16,
        backgroundColor: fill,
        borderWidth: 1,
        borderColor:
          kind === "green"
            ? "#C7EFDD"
            : kind === "blue"
              ? "#D2DCFF"
              : "#F3DA8A",
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 10,
      }}
    >
      <CircleIcon
        name={
          kind === "green"
            ? "shield-filled"
            : kind === "blue"
              ? "refund"
              : "info"
        }
        size={32}
        fill={kind === "green" ? "transparent" : color}
        color={kind === "green" ? C.money : "white"}
      />
      <View style={{ flex: 1 }}>
        <T size={14} weight={700}>
          {title}
        </T>
        {body && (
          <T
            size={12.5}
            weight={500}
            color={
              kind === "green" ? C.money : kind === "yellow" ? "#795A10" : C.ink
            }
            style={{ marginTop: 3 }}
          >
            {body}
          </T>
        )}
      </View>
    </View>
  );
}
export function Bubble({
  voice,
  onNext,
  onToggle,
  muted,
  y,
  nextY = y + 23,
  tail = "top",
}: {
  voice: keyof typeof VOICE;
  onNext: () => void;
  onToggle: () => void;
  muted: boolean;
  y: number;
  nextY?: number;
  tail?: "top" | "bottom";
}) {
  const [title, script] = VOICE[voice];
  const body =
    (
      {
        "5": "Garantía y servicio\nya van en tu cuota.",
        "6-1": `TuTurno te manda\nlos ${money(100)}.`,
        "6-2": "Así todos cobran\ncompleto.",
        "6-3": "Toca y mira cómo\nllega tu turno.",
        "7": "Tu primera cuota, con\ngarantía y servicio.",
        "7b": "Prepárate, que ya casi\nvas con el de verdad.",
        "8": "Falta lo mejor:\ntu turno.",
      } as Partial<Record<keyof typeof VOICE, string>>
    )[voice] ?? script;
  return (
    <>
      <At
        x={12}
        y={y}
        horizontal="stretch"
        anchor={voice.startsWith("6-") ? "top" : "bottom"}
        w={voice.startsWith("4c-") ? 290 : 218}
        h={voice.startsWith("4c-") ? 65 : 83}
        style={{
          backgroundColor: C.bubble,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 9,
          padding: 10,
          paddingTop: 13,
          shadowColor: "white",
          shadowOpacity: 0.4,
          shadowRadius: 6,
        }}
      >
        <Svg
          width={24}
          height={11}
          style={{
            position: "absolute",
            left: 26,
            ...(tail === "top"
              ? { top: -10 }
              : { bottom: -10, transform: [{ rotate: "180deg" }] }),
          }}
        >
          <Path d="M0 11 11 0Q12 -1 14 1L24 11Z" fill={C.bubble} />
        </Svg>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            muted ? "Activar voz de Tutu" : "Silenciar voz de Tutu"
          }
          accessibilityState={{ selected: muted }}
          onPress={onToggle}
        >
          <Face size={37} />
          <View
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 18,
              height: 18,
              borderRadius: 10,
              backgroundColor: C.blue,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              name={muted ? "speaker-off" : "speaker"}
              color="white"
              size={13}
            />
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <T size={voice === "4c-3" ? 15 : 16} weight={800} style={{ lineHeight: 19 }}>
            {title}
          </T>
          <T size={14} weight={500} style={{ marginTop: 4, lineHeight: 19 }}>
            {body}
          </T>
        </View>
      </At>
      <At
        x={246}
        y={nextY}
        w={96}
        h={38}
        anchor={voice.startsWith("6-") ? "top" : "bottom"}
      >
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Siguiente"
          style={({ pressed }) => ({
            flex: 1,
            borderRadius: 22,
            backgroundColor: C.green,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: C.green,
            shadowOpacity: 0.3,
            shadowRadius: 13,
            shadowOffset: { width: 0, height: 7 },
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <T size={16} weight={800}>
            Siguiente
          </T>
        </Pressable>
      </At>
    </>
  );
}
export function PeekingTutu({
  text,
  onToggle,
  muted,
}: {
  text: string;
  onToggle: () => void;
  muted: boolean;
}) {
  return (
    <>
      <At
        x={60}
        y={103}
        horizontal="stretch"
        w={190}
        h={33}
        style={{
          borderRadius: 18,
          backgroundColor: C.bubble,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <T size={14} weight={800}>
          {text}
        </T>
      </At>
      <At x={267} y={96} w={76} h={70} style={{ overflow: "hidden" }}>
        <Image source={illustration.tutu} style={{ width: 80, height: 89 }} />
      </At>
      <At x={248} y={113} w={24} h={24}>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={
            muted ? "Activar voz de Tutu" : "Silenciar voz de Tutu"
          }
          style={{
            flex: 1,
            borderRadius: 12,
            backgroundColor: C.blue,
            borderWidth: 1.5,
            borderColor: "white",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            name={muted ? "speaker-off" : "speaker"}
            color="white"
            size={16}
          />
        </Pressable>
      </At>
    </>
  );
}
export function PaperTicket({ size = 90 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/venezuela-v19/reserved-paper.png")}
      style={{
        width: size * 1.375,
        height: size * 1.5,
        marginLeft: -size * 0.1875,
        marginTop: -size * 0.11,
      }}
      resizeMode="contain"
      accessibilityLabel={`Turno de ${money(100)} reservado`}
    />
  );
}

export function NumberedTitle({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <View
        style={{
          width: 27,
          height: 27,
          borderRadius: 14,
          backgroundColor: C.blue,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <T color="white" size={14} weight={700}>
          {number}
        </T>
      </View>
      <View style={{ flex: 1, paddingTop: 2 }}>
        <T size={18} weight={800}>
          {children}
        </T>
      </View>
    </View>
  );
}
