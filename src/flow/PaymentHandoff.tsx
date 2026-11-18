import React, { useEffect, useRef } from "react";
import { BackHandler, Image, Platform, Pressable, StyleSheet, View } from "react-native";
import { C } from "./content";
import { At, Frame, T } from "./ui";
import { StatusBar } from "../platform/statusBar";

/** La pasarela es una referencia externa; el recorrido termina antes del cobro. */
export function PaymentHandoff({ onBack, onFailed }: { onBack: () => void; onFailed?: () => void }) {
  const button = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS === "web") {
      button.current?.focus();
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);

  return (
    <Frame systemBarDim={0.68}>
      <At x={0} y={28} w={360} h={760} fillToBottom>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Image
          source={require("../../assets/venezuela-v19/chinchin-reference.png")}
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
          resizeMode="contain"
          accessible={false}
          importantForAccessibility="no"
        />
        <View style={styles.backdrop}>
          <View role="dialog" accessibilityViewIsModal aria-modal accessibilityLabel="Fin del flujo" style={styles.dialog}>
            <T size={28} weight={800}>Fin del flujo</T>
            <T size={18} weight={600} style={styles.message}>Aquí comienza el pago con ChinChin.</T>
            <T size={14} color="#555F80" style={styles.description}>Esta vista es una referencia de la pasarela externa. El recorrido de prueba termina aquí.</T>
            <Pressable ref={button} accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.primary, { opacity: pressed ? 0.8 : 1 }]}>
              <T size={16} weight={700}>Volver al resumen</T>
            </Pressable>
            {onFailed && (
              <Pressable accessibilityRole="button" onPress={onFailed} style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.6 : 1 }]}>
                <T size={14} weight={600} color={C.blue}>Ver el caso de pago fallido</T>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </At>
    </Frame>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: "white" },
  backdrop: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(6, 12, 52, 0.68)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 360, padding: 24, borderRadius: 16, backgroundColor: "white" },
  message: { marginTop: 12, lineHeight: 25 },
  description: { marginTop: 12, lineHeight: 21 },
  primary: { minHeight: 52, marginTop: 28, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 26, backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  secondary: { minHeight: 48, marginTop: 8, alignItems: "center", justifyContent: "center" },
});
